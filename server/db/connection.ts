import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import path from 'path';
import { DatabaseSchema } from './schema.js';

const dataDirectory = process.env.DATA_DIRECTORY || './data';
const dbPath = path.join(dataDirectory, 'database.sqlite');

console.log('Database path:', dbPath);

const sqliteDb = new Database(dbPath);

export const db = new Kysely<DatabaseSchema>({
  dialect: new SqliteDialect({
    database: sqliteDb,
  }),
  log: ['query', 'error']
});

export { sqliteDb };
