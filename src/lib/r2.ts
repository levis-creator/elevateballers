import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getEnv } from './env';
import { siteSettingsService } from '../features/settings';

const CACHE_TTL_MS = 30_000;

type R2Config = { client: S3Client; bucket: string; publicUrl?: string; configured: true } | { configured: false };

let cache: { expiresAt: number; identity: string; config: R2Config } | null = null;

async function resolveR2Values() {
  const records = await siteSettingsService.list('security').catch(() => []);
  const dbValue = (key: string) => records.find((record) => record.key === key)?.value;

  const accountId = dbValue('security_r2AccountId') || getEnv('R2_ACCOUNT_ID');
  const endpoint = getEnv('R2_ENDPOINT') || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
  const bucket = dbValue('security_r2BucketName') || getEnv('R2_BUCKET_NAME');
  const accessKeyId = dbValue('security_r2AccessKeyId') || getEnv('R2_ACCESS_KEY_ID');
  const secretAccessKey = dbValue('security_r2SecretAccessKey') || getEnv('R2_SECRET_ACCESS_KEY');
  const publicUrl = (dbValue('security_r2PublicUrl') || getEnv('R2_PUBLIC_URL'))?.replace(/\/$/, '');
  const region = getEnv('R2_REGION', 'auto');

  return { endpoint, bucket, accessKeyId, secretAccessKey, publicUrl, region };
}

/** Resolved R2 client + bucket, or `{ configured: false }`. DB-first, cached ~30s. */
async function getR2Config(): Promise<R2Config> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.config;

  const { endpoint, bucket, accessKeyId, secretAccessKey, publicUrl, region } = await resolveR2Values();
  const identity = `${endpoint ?? ''}:${bucket ?? ''}:${accessKeyId ?? ''}:${secretAccessKey ?? ''}:${publicUrl ?? ''}`;
  if (cache && cache.identity === identity) {
    cache = { ...cache, expiresAt: now + CACHE_TTL_MS };
    return cache.config;
  }

  const configured = Boolean(endpoint && bucket && accessKeyId && secretAccessKey);
  const config: R2Config = configured
    ? {
        configured: true,
        bucket: bucket!,
        publicUrl,
        client: new S3Client({
          region,
          endpoint,
          forcePathStyle: true,
          credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
        }),
      }
    : { configured: false };

  cache = { expiresAt: now + CACHE_TTL_MS, identity, config };
  return config;
}

export async function isR2Configured(): Promise<boolean> {
  return (await getR2Config()).configured;
}

export async function getR2PublicUrl(): Promise<string | undefined> {
  const config = await getR2Config();
  return config.configured ? config.publicUrl : undefined;
}

export async function requireR2(): Promise<{ client: S3Client; bucket: string }> {
  const config = await getR2Config();
  if (!config.configured) {
    throw new Error(
      'R2 is not configured. Set R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY (or the matching Security → Uploads & Integrations fields).'
    );
  }
  return { client: config.client, bucket: config.bucket };
}

export function toR2Key(filePath: string): string {
  return filePath.replace(/^uploads\//, '').replace(/^\/+/, '');
}

export async function putR2Object(
  key: string,
  body: Buffer,
  contentType = 'application/octet-stream'
) {
  const { client, bucket: bucketName } = await requireR2();
  await client.send(
    new PutObjectCommand({ Bucket: bucketName, Key: key, Body: body, ContentType: contentType })
  );
}

export async function deleteR2Object(key: string): Promise<void> {
  const { client, bucket: bucketName } = await requireR2();
  await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}

export async function moveR2Object(fromKey: string, toKey: string): Promise<void> {
  const { client, bucket: bucketName } = await requireR2();
  await client.send(
    new CopyObjectCommand({
      Bucket: bucketName,
      Key: toKey,
      CopySource: `${bucketName}/${fromKey.split('/').map(encodeURIComponent).join('/')}`,
    })
  );
  await deleteR2Object(fromKey);
}

export async function ensureR2Prefix(prefix: string): Promise<void> {
  await putR2Object(`${prefix.replace(/\/+$/, '')}/.keep`, Buffer.from(''));
}

async function listR2Keys(prefix: string): Promise<string[]> {
  const { client, bucket: bucketName } = await requireR2();
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix.replace(/^\/+/, ''),
        ContinuationToken: continuationToken,
      })
    );
    keys.push(...(response.Contents || []).flatMap((object) => (object.Key ? [object.Key] : [])));
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

export async function moveR2Prefix(fromPrefix: string, toPrefix: string): Promise<void> {
  const { client, bucket: bucketName } = await requireR2();
  const sourcePrefix = fromPrefix.replace(/\/+$/, '');
  const targetPrefix = toPrefix.replace(/\/+$/, '');
  const keys = await listR2Keys(`${sourcePrefix}/`);

  for (const sourceKey of keys) {
    const targetKey = `${targetPrefix}/${sourceKey.slice(sourcePrefix.length + 1)}`;
    await client.send(
      new CopyObjectCommand({
        Bucket: bucketName,
        Key: targetKey,
        CopySource: `${bucketName}/${sourceKey.split('/').map(encodeURIComponent).join('/')}`,
      })
    );
  }

  if (keys.length > 0) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      })
    );
  }
}

export async function deleteR2Prefix(prefix: string): Promise<void> {
  const { client, bucket: bucketName } = await requireR2();
  const keys = await listR2Keys(`${prefix.replace(/\/+$/, '')}/`);
  if (keys.length === 0) return;
  await client.send(
    new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    })
  );
}

export async function headR2Object(key: string) {
  const { client, bucket: bucketName } = await requireR2();
  return client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
}

export async function getR2Object(key: string): Promise<Buffer> {
  const { client, bucket: bucketName } = await requireR2();
  const response = await client.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
  if (!response.Body) throw new Error(`R2 object has no body: ${key}`);
  return Buffer.from(await response.Body.transformToByteArray());
}
