import { sqliteTable, text, integer, foreignKey } from 'drizzle-orm/sqlite-core';

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  checked: integer('checked', { mode: 'boolean' }).notNull().default(false),
  tagId: integer('tag_id').references(() => tags.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
});