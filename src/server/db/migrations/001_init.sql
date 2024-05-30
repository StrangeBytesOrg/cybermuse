-- +goose Up
-- create "goose_db_version" table
CREATE TABLE IF NOT EXISTS `goose_db_version` (
  `id` integer NULL PRIMARY KEY AUTOINCREMENT,
  `version_id` integer NOT NULL,
  `is_applied` integer NOT NULL,
  `tstamp` timestamp NULL DEFAULT (datetime('now'))
);
