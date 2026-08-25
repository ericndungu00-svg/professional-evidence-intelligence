CREATE TABLE `commercialEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(40) NOT NULL,
	`analysesCompletedAtTimeOfInterest` int NOT NULL,
	`objective` varchar(10),
	`source` varchar(60),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commercialEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `commercial_events_user_type_unique` UNIQUE(`userId`,`eventType`)
);
--> statement-breakpoint
ALTER TABLE `commercialEvents` ADD CONSTRAINT `commercialEvents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;