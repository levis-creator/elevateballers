# Phase 6 production recovery

The Phase 6 operation is additive. The affected production snapshot is stored at the backup path printed by `npm run backup:season-registration:production`.

## Dry-run recovery

```powershell
$env:SEASON_REGISTRATION_BACKUP='C:\path\to\season-registration-production-<timestamp>.json'
npm run restore:season-registration:production -- --dry-run
```

The dry run only reads the JSON and prints table order/counts.

## Approved recovery

After stopping writes to the affected registration/roster workflows and confirming the backup path:

```powershell
$env:SEASON_REGISTRATION_BACKUP='C:\path\to\season-registration-production-<timestamp>.json'
npm run restore:season-registration:production -- --confirm
npm run audit:season-registration:production
```

The restore is transactional and uses `INSERT ... ON DUPLICATE KEY UPDATE`. It does not drop tables or indexes. Migration rollback is not performed with `prisma migrate reset`; if a migration must be reverted, restore data first and use a reviewed additive repair migration.
