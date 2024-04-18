CREATE TABLE `character` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`firstMessage` text,
	`image` text,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chat` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_character` integer NOT NULL,
	`created` integer DEFAULT 1713418193302 NOT NULL,
	`updated` integer DEFAULT 1713418193302 NOT NULL,
	FOREIGN KEY (`user_character`) REFERENCES `character`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_characters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chat_id` integer NOT NULL,
	`character_id` integer NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chat`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `generate_presets` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`max_tokens` integer NOT NULL,
	`temperature` real NOT NULL,
	`min_p` real,
	`top_p` real,
	`top_k` real
);
--> statement-breakpoint
CREATE TABLE `message` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chat_id` integer NOT NULL,
	`character_id` integer,
	`messageText` text NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chat`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `prompt_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`instruction` text NOT NULL,
	`prompt_template` text NOT NULL
);
