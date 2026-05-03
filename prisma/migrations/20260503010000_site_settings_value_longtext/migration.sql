-- Lift the 191-char cap on site_settings.value so that long content
-- (rich-text bodies for the About page, Homepage Intro, etc.) can be saved.
-- Without this, INSERT/UPDATE either errors (strict sql_mode) or silently
-- truncates (lax sql_mode), and the public page falls back to defaults.

ALTER TABLE `site_settings`
  MODIFY COLUMN `value` LONGTEXT NOT NULL;
