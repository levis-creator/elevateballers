-- The Team Coach role name is hardcoded (COACH_ROLE_NAME) across the users
-- feature — team scoping breaks silently if it's ever renamed or deleted.
-- isSystem=true blocks both via the Roles & Permissions API.
UPDATE `roles` SET `is_system` = true WHERE `name` = 'Team Coach';
