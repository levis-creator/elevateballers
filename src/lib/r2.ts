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

const accountId = getEnv('R2_ACCOUNT_ID');
const endpoint = getEnv('R2_ENDPOINT') || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
const bucket = getEnv('R2_BUCKET_NAME');
const accessKeyId = getEnv('R2_ACCESS_KEY_ID');
const secretAccessKey = getEnv('R2_SECRET_ACCESS_KEY');

export const R2_BUCKET = bucket;
export const R2_PUBLIC_URL = getEnv('R2_PUBLIC_URL')?.replace(/\/$/, '');
export const r2Configured = Boolean(endpoint && bucket && accessKeyId && secretAccessKey);

export const r2Client = r2Configured
  ? new S3Client({
      region: getEnv('R2_REGION', 'auto'),
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    })
  : null;

export function requireR2(): { client: S3Client; bucket: string } {
  if (!r2Client || !R2_BUCKET) {
    throw new Error('R2 is not configured. Set R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.');
  }
  return { client: r2Client, bucket: R2_BUCKET };
}

export function toR2Key(filePath: string): string {
  return filePath.replace(/^uploads\//, '').replace(/^\/+/, '');
}

export async function putR2Object(key: string, body: Buffer, contentType = 'application/octet-stream') {
  const { client, bucket: bucketName } = requireR2();
  await client.send(new PutObjectCommand({ Bucket: bucketName, Key: key, Body: body, ContentType: contentType }));
}

export async function deleteR2Object(key: string): Promise<void> {
  const { client, bucket: bucketName } = requireR2();
  await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}

export async function ensureR2Prefix(prefix: string): Promise<void> {
  await putR2Object(`${prefix.replace(/\/+$/, '')}/.keep`, Buffer.from(''));
}

async function listR2Keys(prefix: string): Promise<string[]> {
  const { client, bucket: bucketName } = requireR2();
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix.replace(/^\/+/, ''),
      ContinuationToken: continuationToken,
    }));
    keys.push(...(response.Contents || []).flatMap((object) => object.Key ? [object.Key] : []));
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

export async function moveR2Prefix(fromPrefix: string, toPrefix: string): Promise<void> {
  const { client, bucket: bucketName } = requireR2();
  const sourcePrefix = fromPrefix.replace(/\/+$/, '');
  const targetPrefix = toPrefix.replace(/\/+$/, '');
  const keys = await listR2Keys(`${sourcePrefix}/`);

  for (const sourceKey of keys) {
    const targetKey = `${targetPrefix}/${sourceKey.slice(sourcePrefix.length + 1)}`;
    await client.send(new CopyObjectCommand({
      Bucket: bucketName,
      Key: targetKey,
      CopySource: `${bucketName}/${sourceKey.split('/').map(encodeURIComponent).join('/')}`,
    }));
  }

  if (keys.length > 0) {
    await client.send(new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    }));
  }
}

export async function deleteR2Prefix(prefix: string): Promise<void> {
  const { client, bucket: bucketName } = requireR2();
  const keys = await listR2Keys(`${prefix.replace(/\/+$/, '')}/`);
  if (keys.length === 0) return;
  await client.send(new DeleteObjectsCommand({
    Bucket: bucketName,
    Delete: { Objects: keys.map((Key) => ({ Key })) },
  }));
}

export async function headR2Object(key: string) {
  const { client, bucket: bucketName } = requireR2();
  return client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
}

export async function getR2Object(key: string): Promise<Buffer> {
  const { client, bucket: bucketName } = requireR2();
  const response = await client.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
  if (!response.Body) throw new Error(`R2 object has no body: ${key}`);
  return Buffer.from(await response.Body.transformToByteArray());
}
