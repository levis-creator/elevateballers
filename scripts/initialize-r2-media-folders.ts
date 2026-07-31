import { putR2Object, r2Configured } from '../src/lib/r2';

const folders = ['general', 'players', 'teams', 'news', 'staff', 'leagues', 'matches', 'documents'];

if (!r2Configured) {
  throw new Error('R2 credentials are required. Configure R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.');
}

for (const folder of folders) {
  await putR2Object(`public/${folder}/.keep`, Buffer.from(''), 'application/octet-stream');
  console.log(`Initialized R2 prefix: public/${folder}/`);
}

console.log(`Initialized ${folders.length} R2 media prefixes.`);
