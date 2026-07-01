-- Adds admin-controllable registration on/off + deadline windows.
-- League: `registration_open` is the master switch (defaults TRUE to preserve the
-- current "open" behavior); the opens/closes columns are an optional time window.
-- Season: an optional narrower window that applies on top of its league's switch.
-- Additive only: new nullable columns plus one non-null boolean with a default,
-- so existing rows keep working with registration open.

-- AlterTable
ALTER TABLE `leagues`
    ADD COLUMN `registration_open` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `registration_opens_at` DATETIME(3) NULL,
    ADD COLUMN `registration_closes_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `seasons`
    ADD COLUMN `registration_opens_at` DATETIME(3) NULL,
    ADD COLUMN `registration_closes_at` DATETIME(3) NULL;
