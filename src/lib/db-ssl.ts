/**
 * TLS for the MariaDB connection pool, from environment variables. It is off
 * unless DB_SSL is set, because the database server must have SSL enabled first:
 *
 *   DB_SSL=true   encrypt and verify the server's certificate
 *   DB_SSL_CA     the CA that signed it, as PEM text or base64-encoded PEM;
 *                 needed when the server uses a self-signed or private
 *                 certificate. The certificate is always verified.
 */
export type DbSslOptions = { rejectUnauthorized: boolean; ca?: string };

function readCa(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes('-----BEGIN')) return trimmed.replace(/\\n/g, '\n');
  return Buffer.from(trimmed, 'base64').toString('utf8');
}

export function dbSslOptions(env: Record<string, string | undefined> = process.env): DbSslOptions | undefined {
  const mode = env.DB_SSL?.trim().toLowerCase();
  if (!mode || mode === 'false' || mode === 'off') return undefined;
  const ca = readCa(env.DB_SSL_CA);
  return ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true };
}
