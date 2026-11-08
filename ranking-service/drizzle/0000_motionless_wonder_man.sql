CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`alias` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scores` (
	`player` text NOT NULL,
	`level` integer NOT NULL,
	`moves` integer NOT NULL,
	`points` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`player`, `level`),
	FOREIGN KEY (`player`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
