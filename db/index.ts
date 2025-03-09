import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import fs from 'fs';

const dbFile = 'shopping-list.db';
const isNewDatabase = !fs.existsSync(dbFile);

const sqlite = new Database(dbFile);
export const db = drizzle(sqlite, { schema });

// Only run migrations for new databases
if (isNewDatabase) {
  try {
    migrate(db, { migrationsFolder: 'drizzle' });
  } catch (error) {
    console.error('Database migration error:', error);
  }
}