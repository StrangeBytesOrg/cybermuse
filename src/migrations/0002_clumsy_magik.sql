ALTER TABLE `prompt_template` RENAME COLUMN `content` TO `instruction_template`;--> statement-breakpoint
ALTER TABLE `prompt_template` RENAME COLUMN `instruction` TO `chat_instruction`;--> statement-breakpoint
ALTER TABLE `prompt_template` ADD `chat_template` text NOT NULL;