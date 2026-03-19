-- Add generated metadata text column for full-text search
ALTER TABLE `user_audit_logs`
  ADD COLUMN `metadata_text` LONGTEXT
    GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(`metadata`, '$'))) STORED,
  ADD FULLTEXT INDEX `user_audit_logs_metadata_text_fulltext` (`metadata_text`);
