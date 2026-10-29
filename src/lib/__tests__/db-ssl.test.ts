import { describe, expect, it } from 'vitest';
import { dbSslOptions } from '../db-ssl';

const PEM = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';

describe('dbSslOptions', () => {
  it('stays off unless DB_SSL is set', () => {
    expect(dbSslOptions({})).toBeUndefined();
    expect(dbSslOptions({ DB_SSL: 'false' })).toBeUndefined();
  });

  it('verifies the server certificate when on', () => {
    expect(dbSslOptions({ DB_SSL: 'true' })).toEqual({ rejectUnauthorized: true });
  });

  it('never turns certificate checks off', () => {
    expect(dbSslOptions({ DB_SSL: 'no-verify' })).toEqual({ rejectUnauthorized: true });
  });

  it('reads the CA as PEM, escaped PEM or base64', () => {
    expect(dbSslOptions({ DB_SSL: 'true', DB_SSL_CA: PEM })?.ca).toBe(PEM);
    expect(dbSslOptions({ DB_SSL: 'true', DB_SSL_CA: PEM.replace(/\n/g, '\\n') })?.ca).toBe(PEM);
    expect(dbSslOptions({ DB_SSL: 'true', DB_SSL_CA: Buffer.from(PEM).toString('base64') })?.ca).toBe(PEM);
  });
});
