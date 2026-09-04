CREATE TABLE `sharedResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(24) NOT NULL,
	`resultData` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sharedResults_id` PRIMARY KEY(`id`),
	CONSTRAINT `sharedResults_slug_unique` UNIQUE(`slug`)
);
