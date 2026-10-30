CREATE TABLE `favourites` (
	`user_id` text NOT NULL,
	`sound_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `sound_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sound_id`) REFERENCES `sounds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pads` (
	`user_id` text NOT NULL,
	`slot` integer NOT NULL,
	`sound_id` text NOT NULL,
	`label` text NOT NULL,
	PRIMARY KEY(`user_id`, `slot`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sound_id`) REFERENCES `sounds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plays` (
	`user_id` text NOT NULL,
	`sound_id` text NOT NULL,
	`played_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `sound_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sound_id`) REFERENCES `sounds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scenes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`banner_path` text,
	`visibility` text DEFAULT 'private' NOT NULL,
	`combat_scene_id` text,
	`data` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `scenes_owner_idx` ON `scenes` (`owner_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sounds` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`artist` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`filename` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`duration_ms` integer,
	`category` text NOT NULL,
	`uploaded_by` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sounds_filename_unique` ON `sounds` (`filename`);--> statement-breakpoint
CREATE INDEX `sounds_category_idx` ON `sounds` (`category`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`discord_id` text NOT NULL,
	`name` text NOT NULL,
	`avatar_url` text,
	`role` text DEFAULT 'gm' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_discord_id_unique` ON `users` (`discord_id`);