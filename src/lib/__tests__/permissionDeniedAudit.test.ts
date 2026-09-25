import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ logAudit: vi.fn(), getUserIdFromRequest: vi.fn() }));

vi.mock('../../features/cms/lib/audit', () => ({ logAudit: mocks.logAudit }));
vi.mock('../../features/cms/lib/auth', () => ({ getUserIdFromRequest: mocks.getUserIdFromRequest }));

import { auditPermissionDenied, DENIAL_WINDOW_MS, resetPermissionDeniedAudit } from '../permissionDeniedAudit';
import { handleApiError } from '../apiError';

const req = (path = '/api/users/u1/role', method = 'PUT') =>
  new Request(`https://site.test${path}?x=1`, { method });
const REASON = 'Forbidden: Required permission "users:update" not granted';

beforeEach(() => {
  vi.clearAllMocks();
  resetPermissionDeniedAudit();
  mocks.getUserIdFromRequest.mockReturnValue('coach-1');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.useRealTimers());

describe('auditPermissionDenied', () => {
  it('records who was refused, where and why', () => {
    auditPermissionDenied(req(), REASON, 'update user roles', '1.2.3.4');
    expect(mocks.logAudit).toHaveBeenCalledWith(expect.any(Request), 'AUTH_PERMISSION_DENIED', {
      method: 'PUT',
      path: '/api/users/u1/role',
      context: 'update user roles',
      reason: 'Required permission "users:update" not granted',
      ip: '1.2.3.4',
    });
  });

  it('logs a repeated denial once per window and reports the skipped repeats', () => {
    vi.useFakeTimers({ now: new Date('2026-09-25T10:00:00Z') });
    for (let i = 0; i < 4; i += 1) auditPermissionDenied(req(), REASON, 'ctx', null);
    expect(mocks.logAudit).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(DENIAL_WINDOW_MS);
    auditPermissionDenied(req(), REASON, 'ctx', null);
    expect(mocks.logAudit).toHaveBeenCalledTimes(2);
    expect(mocks.logAudit.mock.calls[1][2]).toMatchObject({ repeatsSinceLastLog: 3 });
  });

  it('treats a different endpoint or user as a separate denial', () => {
    auditPermissionDenied(req('/api/a'), REASON, 'ctx', null);
    auditPermissionDenied(req('/api/b'), REASON, 'ctx', null);
    mocks.getUserIdFromRequest.mockReturnValue('coach-2');
    auditPermissionDenied(req('/api/a'), REASON, 'ctx', null);
    expect(mocks.logAudit).toHaveBeenCalledTimes(3);
  });

  it('ignores signed-out requests', () => {
    mocks.getUserIdFromRequest.mockReturnValue(null);
    auditPermissionDenied(req(), REASON, 'ctx', null);
    expect(mocks.logAudit).not.toHaveBeenCalled();
  });
});

describe('handleApiError', () => {
  it('audits a Forbidden error and still returns 403', async () => {
    const response = handleApiError(new Error(REASON), 'update user roles', req());
    expect(response.status).toBe(403);
    expect(mocks.logAudit).toHaveBeenCalledWith(
      expect.any(Request),
      'AUTH_PERMISSION_DENIED',
      expect.objectContaining({ context: 'update user roles' })
    );
  });

  it('does not audit signed-out 401s', () => {
    expect(handleApiError(new Error('Unauthorized'), 'ctx', req()).status).toBe(401);
    expect(mocks.logAudit).not.toHaveBeenCalled();
  });

  it('returns 403 even if auditing throws', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.getUserIdFromRequest.mockImplementation(() => {
      throw new Error('bad token');
    });
    expect(handleApiError(new Error(REASON), 'ctx', req()).status).toBe(403);
    error.mockRestore();
  });
});
