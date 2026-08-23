CREATE TABLE `passwordResetTokens` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordResetTokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `passwordResetTokens` ADD CONSTRAINT `passwordResetTokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;