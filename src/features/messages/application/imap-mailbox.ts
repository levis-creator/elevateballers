import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from '../../../lib/prisma';
import { siteSettingsService } from '../../settings';

type MailboxConfig = { host?: string; port?: string | number; username?: string; password?: string; mailbox?: string; secure?: string | boolean };

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
  try {
    const lock = await client.getMailboxLock(config.mailbox);
    try {
      const uids = await client.search({ all: true }, { uid: true });
      const recent = Array.isArray(uids) ? uids.slice(-100) : [];
      for await (const message of client.fetch(recent, { uid: true, envelope: true, source: true, flags: true, internalDate: true }, { uid: true })) {
        const externalId = String(message.envelope?.messageId || `${config.mailbox}:${message.uid}`);
        if (await prisma.contactMessage.findUnique({ where: { externalId }, select: { id: true } })) continue;
        const parsed = await simpleParser(message.source as Buffer);
        const sender = parsed.from?.value?.[0];
        const email = sender?.address || message.envelope?.from?.[0]?.address || 'unknown@unknown.invalid';
        const name = sender?.name || message.envelope?.from?.[0]?.name || email;
        await prisma.contactMessage.create({
          data: {
            name: name.slice(0, 120),
            email: email.slice(0, 190),
            subject: (parsed.subject || message.envelope?.subject || '(No subject)').slice(0, 190),
            message: (parsed.text || parsed.html || '').toString(),
            read: Boolean(message.flags?.has('\\Seen')),
            source: 'IMAP',
            externalId,
            createdAt: message.internalDate ?? new Date(),
          },
        });
        imported += 1;
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => undefined);
  }
  return { imported, mailbox: config.mailbox };
}
