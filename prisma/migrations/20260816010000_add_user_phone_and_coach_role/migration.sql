-- AlterTable
ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(191) NULL;

-- Seed the Team Coach role — scopes a coach's admin access to the specific
-- clubs assigned via TeamOwnership (role = 'Team Coach') rather than the
-- whole league. Idempotent so re-running this migration is harmless.
INSERT INTO `roles` (`id`, `name`, `description`, `is_system`, `created_at`, `updated_at`)
SELECT 'role-team-coach', 'Team Coach', 'Manages one or two clubs: their roster, staff and team profile. Sees nothing belonging to another club.', false, NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `roles` WHERE `name` = 'Team Coach');
