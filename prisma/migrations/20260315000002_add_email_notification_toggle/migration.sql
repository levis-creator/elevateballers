-- AlterTable
ALTER TABLE `user_notification_settings`
  ADD COLUMN `email_enabled` BOOLEAN NOT NULL DEFAULT true;
