-- Admin notes sent to the applicant when a registration is marked NEEDS_CHANGES.
ALTER TABLE `teams` ADD COLUMN `review_notes` TEXT NULL;
ALTER TABLE `players` ADD COLUMN `review_notes` TEXT NULL;

-- Lets the review queue find other teams registered by the same coach email.
CREATE INDEX `teams_contact_email_idx` ON `teams`(`contact_email`);
