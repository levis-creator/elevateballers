import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  waitUntil: vi.fn(),
  writeAuditLog: vi.fn(),
  getUserIdFromRequest: vi.fn(),
}));

vi.mock('@vercel/functions', () => ({ waitUntil: mocks.waitUntil }));
vi.mock('../../../domain/usecases/auth', () => ({
  writeAuditLog: mocks.writeAuditLog,
  getUserIdFromRequest: mocks.getUserIdFromRequest,
}));

import { logAudit, logAuditSystem } from '../audit';

const request = new Request('https://site.test/api/x');

beforeEach(() => {
  vi.clearAllMocks();
  mocks.writeAuditLog.mockResolvedValue(undefined);
  mocks.getUserIdFromRequest.mockReturnValue('admin-1');
});

describe('logAudit', () => {
  it('writes the actor, action and metadata, and keeps the function alive for it', () => {
    logAudit(request, 'CONTACT_MESSAGE_REPLIED', { contactMessageId: 'm1' });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith('admin-1', 'CONTACT_MESSAGE_REPLIED', 'admin-1', {
      contactMessageId: 'm1',
      source: 'explicit',
    });
    expect(mocks.waitUntil).toHaveBeenCalledWith(expect.any(Promise));
  });

  it('records the target user separately from the actor', () => {
    logAudit(request, 'USER_ROLE_CHANGED', {}, 'user-9');
    expect(mocks.writeAuditLog).toHaveBeenCalledWith('user-9', 'USER_ROLE_CHANGED', 'admin-1', { source: 'explicit' });
  });

  it('attributes requests without a session to anonymous', () => {
    mocks.getUserIdFromRequest.mockReturnValue(null);
    logAudit(request, 'CONTACT_MESSAGE_SUBMITTED');
    expect(mocks.writeAuditLog).toHaveBeenCalledWith('anonymous', 'CONTACT_MESSAGE_SUBMITTED', 'anonymous', {
      source: 'explicit',
    });
  });

  it('skips high-frequency game actions', () => {
    logAudit(request, 'GAME_CLOCK_TOGGLED');
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it('never throws when the write or keep-alive fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.writeAuditLog.mockRejectedValue(new Error('db down'));
    mocks.waitUntil.mockImplementation(() => {
      throw new Error('no request context');
    });
    expect(() => logAudit(request, 'CONTACT_MESSAGE_DELETED')).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});

describe('logAuditSystem', () => {
  it('writes as the system actor and keeps the function alive', () => {
    logAuditSystem('EMAIL_QUEUED_FOR_RETRY', { outboxId: 'o1' });
    expect(mocks.writeAuditLog).toHaveBeenCalledWith('system', 'EMAIL_QUEUED_FOR_RETRY', 'system', {
      outboxId: 'o1',
      source: 'system',
    });
    expect(mocks.waitUntil).toHaveBeenCalledTimes(1);
  });
});
