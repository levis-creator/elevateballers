import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from '../../../lib/prisma';
import { siteSettingsService } from '../../settings';

type MailboxConfig = { host?: string; port?: string | number; username?: string; password?: string; mailbox?: string; secure?: string | boolean };
type ImapFolder = 'INBOX' | 'SPAM' | 'TRASH' | 'SENT';

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
          const targetFolder = folder === 'TRASH' ? 'TRASH' : folder;
          const direction = folder === 'SENT' ? 'OUTBOUND' : 'INBOUND';
          if (existing) {
            await prisma.contactMessage.update({ where: { id: existing.id }, data: { read: isRead, folder: targetFolder, direction, imapUid: message.uid, imapFolder: path, trashedAt: targetFolder === 'TRASH' ? (existing.trashedAt ?? new Date()) : existing.trashedAt } });
            updated += 1;
            continue;
          }
          const parsed = await simpleParser(message.source as Buffer);
          const person = folder === 'SENT' ? parsed.to?.value?.[0] : parsed.from?.value?.[0];
          const fallback = folder === 'SENT' ? message.envelope?.to?.[0] : message.envelope?.from?.[0];
          const email = person?.address || fallback?.address || 'unknown@unknown.invalid';
          const name = person?.name || fallback?.name || email;
          await prisma.contactMessage.create({
            data: {
              name: name.slice(0, 120),
              email: email.slice(0, 190),
              subject: (parsed.subject || message.envelope?.subject || '(No subject)').slice(0, 190),
              message: (parsed.text || parsed.html || '').toString(),
              read: isRead,
              source: 'IMAP',
              direction,
              folder: targetFolder,
              spamAt: targetFolder === 'SPAM' ? new Date() : null,
              sentAt: direction === 'OUTBOUND' ? (message.internalDate ?? new Date()) : null,
              externalId,
              imapUid: message.uid,
              imapFolder: path,
              createdAt: message.internalDate ?? new Date(),
            },
          });
          imported += 1;
        }
      } finally {
        lock.release();
      }
    }
  } finally {
    await client.logout().catch(() => undefined);
  }
  return { imported, updated, mailbox: config.mailbox };
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
