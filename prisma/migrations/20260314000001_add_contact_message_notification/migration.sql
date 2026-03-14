-- Alter enum for registration_notifications.type to include CONTACT_MESSAGE
ALTER TABLE `registration_notifications`
MODIFY `type` ENUM('TEAM_REGISTERED','PLAYER_REGISTERED','PLAYER_AUTO_LINKED','CONTACT_MESSAGE') NOT NULL;
