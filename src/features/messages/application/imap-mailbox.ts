import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { prisma } from '../../../lib/prisma';
import { siteSettingsService } from '../../settings';
import { sanitizeHtml } from '../../../lib/sanitize';
import { readFile, saveFile } from '../../../lib/file-storage';
import { createOperationalNotification } from '../../cms/lib/adminNotifications';

type MailboxConfig = { host?: string; port?: string | number; username?: string; password?: string; mailbox?: string; secure?: string | boolean };
type ImapFolder = 'INBOX' | 'SPAM' | 'TRASH' | 'SENT' | 'DRAFT';
const execFileAsync = promisify(execFile);
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const BLOCKED_EXTENSIONS = new Set(['.ade', '.adp', '.app', '.bat', '.cmd', '.com', '.cpl', '.dll', '.exe', '.hta', '.ins', '.iso', '.js', '.jse', '.lnk', '.msi', '.msp', '.mst', '.ps1', '.scr', '.sct', '.sh', '.svg', '.sys', '.vbe', '.vbs', '.ws', '.wsc', '.wsh']);
const BLOCKED_MIME_TYPES = new Set(['application/javascript', 'application/x-javascript', 'application/x-msdownload', 'application/x-sh', 'text/html', 'image/svg+xml']);

type ParsedAttachment = { filename?: string; contentType?: string; size?: number; cid?: string; content: Buffer };

function safeFilename(filename: string | undefined) {
  const cleaned = (filename || 'attachment.bin').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 150);
  return cleaned || 'attachment.bin';
}

function blockedReason(filename: string, mimeType: string, size: number) {
  const extension = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')).toLowerCase() : '';
  if (size > MAX_ATTACHMENT_BYTES) return `Attachment exceeds the ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB limit.`;
  if (BLOCKED_EXTENSIONS.has(extension) || BLOCKED_MIME_TYPES.has(mimeType.toLowerCase())) return 'This file type is blocked for security reasons.';
  return null;
}

async function scanBuffer(buffer: Buffer, filename: string): Promise<{ status: 'CLEAN' | 'BLOCKED' | 'PENDING_SCAN'; reason?: string }> {
  const tempPath = join(tmpdir(), `eb-mail-${randomUUID()}-${safeFilename(filename)}`);
  try {
    await writeFile(tempPath, buffer);
    try {
      await execFileAsync(process.env.CLAMSCAN_PATH || 'clamscan', ['--no-summary', '--infected', tempPath], { timeout: 30_000, windowsHide: true });
      return { status: 'CLEAN' };
    } catch (error: any) {
      if (error?.code === 1) return { status: 'BLOCKED', reason: 'Antivirus scanner detected a threat.' };
      if (error?.code === 'ENOENT') return { status: 'PENDING_SCAN', reason: 'Waiting for the configured antivirus scanner.' };
      return { status: 'PENDING_SCAN', reason: 'Antivirus scan could not be completed.' };
    }
  } finally {
    await unlink(tempPath).catch(() => undefined);
  }
}

async function storeParsedAttachments(messageId: string, messageExternalId: string, attachments: ParsedAttachment[]) {
  let stored = 0;
  for (const [index, attachment] of attachments.entries()) {
    const filename = safeFilename(attachment.filename);
    const mimeType = String(attachment.contentType || 'application/octet-stream').slice(0, 190);
    const size = Number(attachment.size || attachment.content.length || 0);
    const externalId = `${messageExternalId}:attachment:${index}`;
    if (await prisma.messageAttachment.findUnique({ where: { externalId }, select: { id: true } })) continue;
    const reason = blockedReason(filename, mimeType, size);
    if (reason) {
      await prisma.messageAttachment.create({ data: { messageId, externalId, filename, mimeType, size, contentId: attachment.cid || null, scanStatus: 'BLOCKED', scanReason: reason } });
      continue;
    }
    const scan = await scanBuffer(attachment.content, filename);
    let storagePath: string | null = null;
    if (scan.status !== 'BLOCKED') {
      const saved = await saveFile('mail-quarantine', attachment.content, true, `${messageId}-${randomUUID()}-${filename}`);
      storagePath = saved.filePath;
      stored += 1;
    }
    await prisma.messageAttachment.create({ data: { messageId, externalId, filename, mimeType, size, contentId: attachment.cid || null, storagePath, scanStatus: scan.status, scanReason: scan.reason || null } });
  }
  return stored;
}

export async function scanPendingAttachments() {
  const pending = await prisma.messageAttachment.findMany({ where: { scanStatus: 'PENDING_SCAN', storagePath: { not: null } }, take: 50, orderBy: { createdAt: 'asc' } });
  let clean = 0;
  let blocked = 0;
  for (const attachment of pending) {
    const buffer = await readFile(attachment.storagePath!);
    const result = await scanBuffer(buffer, attachment.filename);
    if (result.status === 'PENDING_SCAN') continue;
    await prisma.messageAttachment.update({ where: { id: attachment.id }, data: { scanStatus: result.status, scanReason: result.reason || null } });
    if (result.status === 'CLEAN') clean++; else blocked++;
  }
  return { clean, blocked, pending: pending.length - clean - blocked };
}

async function getConfig(): Promise<Required<Pick<MailboxConfig, 'host' | 'username' | 'password' | 'mailbox'>> & { port: number; secure: boolean }> {
  const setting = await siteSettingsService.get('mailbox_imap');
  let config: MailboxConfig = {};
  try { config = JSON.parse(setting?.value ?? '{}') as MailboxConfig; } catch { /* invalid config handled below */ }
  const host = String(config.host ?? '').trim();
  const username = String(config.username ?? '').trim();
  const password = String(config.password ?? '');
  const mailbox = String(config.mailbox ?? 'INBOX').trim() || 'INBOX';
  const port = Number(config.port ?? 993);
  if (!host || !username || !password || !Number.isInteger(port)) throw new Error('Configure the IMAP host, port, username, and password in Settings first.');
  return { host, username, password, mailbox, port, secure: config.secure !== false && config.secure !== 'false' };
}

async function openClient() {
  const config = await getConfig();
  const client = new ImapFlow({ host: config.host, port: config.port, secure: config.secure, auth: { user: config.username, pass: config.password }, logger: false });
  await client.connect();
  return { client, config };
}

function classifyMailbox(path: string): ImapFolder | null {
  const value = path.toLowerCase();
  if (value === 'inbox') return 'INBOX';
  if (/(spam|junk|bulk mail|junk e-mail)/.test(value)) return 'SPAM';
  if (/(trash|deleted items|deleted messages|bin)/.test(value)) return 'TRASH';
  if (/(sent|sent items|sent mail|outbox)/.test(value)) return 'SENT';
  if (/(draft|drafts)/.test(value)) return 'DRAFT';
  return null;
}

async function mailboxPaths(client: ImapFlow, config: Awaited<ReturnType<typeof getConfig>>) {
  const listed = await client.list();
  const folders = new Map<ImapFolder, string>();
  folders.set('INBOX', config.mailbox);
  for (const mailbox of listed) {
    const kind = classifyMailbox(mailbox.path);
    if (kind && !folders.has(kind)) folders.set(kind, mailbox.path);
  }
  return folders;
}

export async function testImapConnection() {
  const { client, config } = await openClient();
  try {
    await client.mailboxOpen(config.mailbox, { readOnly: true });
    return { mailbox: config.mailbox, host: config.host };
  } finally {
    await client.logout().catch(() => undefined);
  }
}

export async function syncImapMailbox() {
  const { client, config } = await openClient();
  let imported = 0;
  let updated = 0;
  try {
    const folders = await mailboxPaths(client, config);
    for (const [folder, path] of folders) {
      const lock = await client.getMailboxLock(path);
      try {
        const uids = await client.search({ all: true }, { uid: true });
        const recent = Array.isArray(uids) ? uids.slice(-100) : [];
        for await (const message of client.fetch(recent, { uid: true, envelope: true, source: true, flags: true, internalDate: true }, { uid: true })) {
          const externalId = String(message.envelope?.messageId || `${path}:${message.uid}`);
          const existing = await prisma.contactMessage.findUnique({ where: { externalId }, select: { id: true, folder: true, trashedAt: true } });
          const isRead = Boolean(message.flags?.has('\\Seen'));
          const targetFolder = folder;
          const direction = folder === 'SENT' || folder === 'DRAFT' ? 'OUTBOUND' : 'INBOUND';
          const parsed = await simpleParser(message.source as Buffer);
          const parsedText = (parsed.text || parsed.html || '').toString();
          const parsedHtml = parsed.html ? sanitizeHtml(String(parsed.html)) : null;
          const references = Array.isArray(parsed.references) ? parsed.references.join(' ') : String(parsed.references || '');
          const threadId = references.split(/\s+/).filter(Boolean)[0] || parsed.inReplyTo || externalId;
          if (existing) {
            await prisma.contactMessage.update({ where: { id: existing.id }, data: { read: isRead, folder: targetFolder, direction, message: parsedText, htmlBody: parsedHtml, draftReply: targetFolder === 'DRAFT' ? parsedText : undefined, threadId, inReplyTo: parsed.inReplyTo || null, references: references || null, deliveryStatus: direction === 'OUTBOUND' ? (targetFolder === 'DRAFT' ? 'DRAFT' : 'SENT') : 'RECEIVED', imapUid: message.uid, imapFolder: path, trashedAt: targetFolder === 'TRASH' ? (existing.trashedAt ?? new Date()) : existing.trashedAt } });
            await storeParsedAttachments(existing.id, externalId, parsed.attachments as ParsedAttachment[]);
            updated += 1;
            continue;
          }
          const person = direction === 'OUTBOUND' ? parsed.to?.value?.[0] : parsed.from?.value?.[0];
          const fallback = direction === 'OUTBOUND' ? message.envelope?.to?.[0] : message.envelope?.from?.[0];
          const email = person?.address || fallback?.address || 'unknown@unknown.invalid';
          const name = person?.name || fallback?.name || email;
          const created = await prisma.contactMessage.create({
            data: {
              name: name.slice(0, 120),
              email: email.slice(0, 190),
              subject: (parsed.subject || message.envelope?.subject || '(No subject)').slice(0, 190),
              message: parsedText,
              htmlBody: parsedHtml,
              read: isRead,
              source: 'IMAP',
              direction,
              folder: targetFolder,
              spamAt: targetFolder === 'SPAM' ? new Date() : null,
              sentAt: direction === 'OUTBOUND' ? (message.internalDate ?? new Date()) : null,
              draftReply: targetFolder === 'DRAFT' ? parsedText : null,
              threadId,
              inReplyTo: parsed.inReplyTo || null,
              references: references || null,
              deliveryStatus: direction === 'OUTBOUND' ? (targetFolder === 'DRAFT' ? 'DRAFT' : 'SENT') : 'RECEIVED',
              externalId,
              imapUid: message.uid,
              imapFolder: path,
              createdAt: message.internalDate ?? new Date(),
            },
          });
          await storeParsedAttachments(created.id, externalId, parsed.attachments as ParsedAttachment[]);
          imported += 1;
        }
      } finally {
        lock.release();
      }
    }
  } finally {
    await client.logout().catch(() => undefined);
  }
  const attachmentScan = await scanPendingAttachments().catch((error) => {
    console.warn('[messages] attachment scan failed:', error);
    return { clean: 0, blocked: 0, pending: 0 };
  });
  if (attachmentScan.blocked > 0) {
    await createOperationalNotification({
      type: 'ATTACHMENT_BLOCKED',
      message: `${attachmentScan.blocked} mailbox attachment${attachmentScan.blocked === 1 ? '' : 's'} blocked after security scanning.`,
      severity: 'critical',
      metadata: { blockedCount: attachmentScan.blocked, action: 'REVIEW_ATTACHMENTS' },
    }).catch((error) => console.warn('[messages] attachment notification failed:', error));
  }
  return { imported, updated, mailbox: config.mailbox, attachmentScan };
}

export async function appendSentMessage(data: { to: string; subject: string; text: string; html?: string; messageId: string; date?: Date }) {
  const { client, config } = await openClient();
  try {
    const folders = await mailboxPaths(client, config);
    const sent = folders.get('SENT');
    if (!sent) return false;
    const from = config.username;
    const date = data.date ?? new Date();
    const body = data.html ? `<html><body>${data.html}</body></html>` : data.text;
    const content = [
      `From: ${from}`,
      `To: ${data.to}`,
      `Subject: ${data.subject}`,
      `Date: ${date.toUTCString()}`,
      `Message-ID: <${data.messageId}>`,
      'MIME-Version: 1.0',
      data.html ? 'Content-Type: text/html; charset=utf-8' : 'Content-Type: text/plain; charset=utf-8',
      '',
      body,
      '',
    ].join('\\r\\n');
    await client.append(sent, Buffer.from(content, 'utf8'), ['\\Seen'], date);
    return true;
  } finally {
    await client.logout().catch(() => undefined);
  }
}

export async function updateImapMessageState(data: { folder?: string; read?: boolean; imapFolder?: string | null; imapUid?: number | null }) {
  if (!data.imapFolder || !data.imapUid) return;
  const { client, config } = await openClient();
  try {
    const folders = await mailboxPaths(client, config);
    const lock = await client.getMailboxLock(data.imapFolder);
    try {
      if (data.read === true) await client.messageFlagsAdd(data.imapUid, ['\\Seen'], { uid: true });
      if (data.read === false) await client.messageFlagsRemove(data.imapUid, ['\\Seen'], { uid: true });
      const destination = data.folder === 'SPAM' ? folders.get('SPAM') : data.folder === 'TRASH' ? folders.get('TRASH') : data.folder === 'INBOX' ? config.mailbox : undefined;
      if (destination && destination !== data.imapFolder) await client.messageMove(data.imapUid, destination, { uid: true });
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => undefined);
  }
}
