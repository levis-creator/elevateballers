-- Backfill audit metadata source tags for existing rows
UPDATE `user_audit_logs`
SET `metadata` = JSON_OBJECT('source', 'legacy')
WHERE `metadata` IS NULL;

UPDATE `user_audit_logs`
SET `metadata` = JSON_SET(`metadata`, '$.source', 'legacy')
WHERE JSON_EXTRACT(`metadata`, '$.source') IS NULL;
