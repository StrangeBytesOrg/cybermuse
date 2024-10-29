ALTER TABLE `prompt_template` ADD `template` text NOT NULL;--> statement-breakpoint
ALTER TABLE `prompt_template` DROP COLUMN `instruction_template`;--> statement-breakpoint
ALTER TABLE `prompt_template` DROP COLUMN `chat_template`;--> statement-breakpoint
ALTER TABLE `prompt_template` DROP COLUMN `chat_instruction`;