PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_receipts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`image_base64` text NOT NULL,
	`item_id` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_receipts`("id", "created_at", "image_base64", "item_id") SELECT "id", "created_at", "image_base64", "item_id" FROM `receipts`;--> statement-breakpoint
DROP TABLE `receipts`;--> statement-breakpoint
ALTER TABLE `__new_receipts` RENAME TO `receipts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;