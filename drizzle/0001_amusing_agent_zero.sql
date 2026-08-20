CREATE TABLE `criterionAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`requirementId` int NOT NULL,
	`assessment` enum('demonstrated','partial','not_found','unsupported') NOT NULL,
	`strength` enum('strong','moderate','weak','not_demonstrated','contradicted') NOT NULL,
	`interpretation` mediumtext NOT NULL,
	`gap` mediumtext NOT NULL,
	`nextStep` mediumtext,
	`evidenceIds` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `criterionAssessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidenceAnalyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int,
	`targetDocumentId` int,
	`objective` enum('A','B','C') NOT NULL,
	`title` varchar(255) NOT NULL,
	`status` enum('complete','processing','failed') NOT NULL DEFAULT 'processing',
	`generatedSummary` mediumtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidenceAnalyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidenceContradictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`type` varchar(120) NOT NULL,
	`severity` enum('review','unsupported') NOT NULL,
	`claim` mediumtext NOT NULL,
	`explanation` mediumtext NOT NULL,
	`evidenceIds` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidenceContradictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidenceDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int,
	`title` varchar(255) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(150) NOT NULL,
	`documentType` enum('evidence','target') NOT NULL,
	`sourceKind` varchar(80) NOT NULL,
	`storageKey` varchar(1024),
	`fileUrl` varchar(2048),
	`extractedText` mediumtext NOT NULL,
	`extractionStatus` enum('ready','needs_review','failed') NOT NULL DEFAULT 'ready',
	`isDemo` enum('yes','no') NOT NULL DEFAULT 'no',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidenceDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidenceProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentRole` varchar(255) NOT NULL,
	`profession` varchar(255) NOT NULL,
	`specialty` varchar(255),
	`experience` varchar(255),
	`currentLevel` varchar(100),
	`targetRole` varchar(255),
	`careerObjective` text,
	`ownClaims` mediumtext,
	`isDemo` enum('yes','no') NOT NULL DEFAULT 'no',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evidenceProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `evidence_profiles_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `extractedEvidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentId` int NOT NULL,
	`statement` text NOT NULL,
	`excerpt` mediumtext NOT NULL,
	`sourceLocation` varchar(255) NOT NULL,
	`category` varchar(120) NOT NULL,
	`evidenceType` varchar(100) NOT NULL,
	`dateHint` varchar(120),
	`outcome` text,
	`confidence` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `extractedEvidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `targetRequirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetDocumentId` int NOT NULL,
	`category` varchar(120) NOT NULL,
	`criterion` text NOT NULL,
	`sourceLocation` varchar(255) NOT NULL,
	`ordinal` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `targetRequirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `criterionAssessments` ADD CONSTRAINT `criterionAssessments_analysisId_evidenceAnalyses_id_fk` FOREIGN KEY (`analysisId`) REFERENCES `evidenceAnalyses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `criterionAssessments` ADD CONSTRAINT `criterionAssessments_requirementId_targetRequirements_id_fk` FOREIGN KEY (`requirementId`) REFERENCES `targetRequirements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidenceAnalyses` ADD CONSTRAINT `evidenceAnalyses_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidenceAnalyses` ADD CONSTRAINT `evidenceAnalyses_profileId_evidenceProfiles_id_fk` FOREIGN KEY (`profileId`) REFERENCES `evidenceProfiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidenceAnalyses` ADD CONSTRAINT `evidenceAnalyses_targetDocumentId_evidenceDocuments_id_fk` FOREIGN KEY (`targetDocumentId`) REFERENCES `evidenceDocuments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidenceContradictions` ADD CONSTRAINT `evidenceContradictions_analysisId_evidenceAnalyses_id_fk` FOREIGN KEY (`analysisId`) REFERENCES `evidenceAnalyses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidenceDocuments` ADD CONSTRAINT `evidenceDocuments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidenceDocuments` ADD CONSTRAINT `evidenceDocuments_profileId_evidenceProfiles_id_fk` FOREIGN KEY (`profileId`) REFERENCES `evidenceProfiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidenceProfiles` ADD CONSTRAINT `evidenceProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `extractedEvidence` ADD CONSTRAINT `extractedEvidence_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `extractedEvidence` ADD CONSTRAINT `extractedEvidence_documentId_evidenceDocuments_id_fk` FOREIGN KEY (`documentId`) REFERENCES `evidenceDocuments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `targetRequirements` ADD CONSTRAINT `targetRequirements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `targetRequirements` ADD CONSTRAINT `targetRequirements_targetDocumentId_evidenceDocuments_id_fk` FOREIGN KEY (`targetDocumentId`) REFERENCES `evidenceDocuments`(`id`) ON DELETE no action ON UPDATE no action;