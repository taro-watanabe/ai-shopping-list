import {
	sqliteTable,
	text,
	integer,
	foreignKey,
	real,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const tags = sqliteTable("tags", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	color: text("color").notNull(),
	createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),
});

export const people = sqliteTable("people", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	color: text("color").notNull(),
	createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),
});

export const receipts = sqliteTable("receipts", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	imageBase64: text("image_base64").notNull(),
});

export const items = sqliteTable("items", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	checked: integer("checked", { mode: "boolean" }).notNull().default(false),
	tagId: integer("tag_id").references(() => tags.id),
	personId: integer("person_id").references(() => people.id),
	createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	price: real("price"),
	checkedAt: text("checked_at"),
	receiptId: integer("receipt_id").references(() => receipts.id), // Add this new field
});
