-- +goose Up
-- create "characters" table
CREATE TABLE `characters` (
  `id` integer NOT NULL PRIMARY KEY AUTOINCREMENT,
  `name` varchar NULL,
  `description` varchar NULL,
  `type` varchar NOT NULL DEFAULT 'character',
  `first_message` varchar NULL,
  `image` varchar NULL
);
-- create "chats" table
CREATE TABLE `chats` (
  `id` integer NOT NULL PRIMARY KEY AUTOINCREMENT,
  `created_at` timestamp NOT NULL DEFAULT (current_timestamp),
  `updated_at` timestamp NOT NULL DEFAULT (current_timestamp)
);
-- create "chat_characters" table
CREATE TABLE `chat_characters` (
  `chat_id` integer NOT NULL,
  `character_id` integer NOT NULL,
  PRIMARY KEY (`chat_id`, `character_id`)
);
-- create "messages" table
CREATE TABLE `messages` (
  `id` integer NOT NULL PRIMARY KEY AUTOINCREMENT,
  `chat_id` integer NOT NULL,
  `character_id` integer NOT NULL,
  `generated` boolean NOT NULL,
  `active_index` integer NOT NULL
);
-- create "message_contents" table
CREATE TABLE `message_contents` (
  `id` integer NOT NULL PRIMARY KEY AUTOINCREMENT,
  `text` varchar NOT NULL,
  `message_id` integer NOT NULL
);
-- create "prompt_templates" table
CREATE TABLE `prompt_templates` (
  `id` integer NOT NULL PRIMARY KEY AUTOINCREMENT,
  `name` varchar NOT NULL,
  `content` varchar NOT NULL,
  `active` boolean NOT NULL
);
-- create "generate_presets" table
CREATE TABLE `generate_presets` (
  `id` integer NOT NULL PRIMARY KEY AUTOINCREMENT,
  `name` varchar NOT NULL,
  `active` boolean NOT NULL,
  `max_tokens` integer NULL,
  `temperature` real NULL,
  `top_k` real NULL,
  `top_p` real NULL,
  `min_p` real NULL,
  `tfsz` real NULL,
  `typical_p` real NULL,
  `repeat_penalty` real NULL,
  `repeat_last_n` real NULL,
  `penalize_nl` boolean NULL,
  `presence_penalty` real NULL,
  `frequency_penalty` real NULL,
  `mirostat` integer NULL,
  `mirostat_tau` real NULL,
  `mirostat_eta` real NULL
);
