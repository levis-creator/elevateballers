ALTER TABLE `players`
  ADD COLUMN `date_of_birth` DATETIME(3) NULL,
  ADD COLUMN `nationality` VARCHAR(191) NULL,
  ADD COLUMN `height_cm` INTEGER NULL,
  ADD COLUMN `weight_kg` INTEGER NULL;
