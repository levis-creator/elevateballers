ALTER TABLE `staff`
  ADD COLUMN `user_id` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `staff_user_id_key` ON `staff`(`user_id`);

ALTER TABLE `staff`
  ADD CONSTRAINT `staff_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
