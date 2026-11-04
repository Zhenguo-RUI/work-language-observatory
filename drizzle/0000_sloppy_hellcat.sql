CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`analysis_id` text,
	`action` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`raw_text` text NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`text_hash` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`engine` text DEFAULT 'rules' NOT NULL,
	`result_json` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`change_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `analyses_owner_status` ON `analyses` (`owner_id`,`status`);--> statement-breakpoint
CREATE INDEX `analyses_hash` ON `analyses` (`text_hash`);--> statement-breakpoint
CREATE TABLE `corpus_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`reviewer_id` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`analysis_id` text NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`analysis_id`) REFERENCES `analyses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`analysis_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`decision` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`issues_json` text DEFAULT '[]' NOT NULL,
	`revision` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`analysis_id`) REFERENCES `analyses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `versions` (
	`id` text PRIMARY KEY NOT NULL,
	`analysis_id` text NOT NULL,
	`revision` integer NOT NULL,
	`result_json` text NOT NULL,
	`status` text NOT NULL,
	`author_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`analysis_id`) REFERENCES `analyses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `version_number` ON `versions` (`analysis_id`,`revision`);