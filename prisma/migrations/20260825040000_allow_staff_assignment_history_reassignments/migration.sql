DROP INDEX `team_staff_team_id_staff_id_key` ON `team_staff`;

CREATE INDEX `team_staff_team_id_staff_id_idx` ON `team_staff`(`team_id`, `staff_id`);
