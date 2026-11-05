import { existsSync, readFileSync } from 'node:fs';
import { config, parse } from 'dotenv';
import { defineConfig } from 'vitest/config';

// The app loads env via `dotenv/config`, which only reads `.env` (the dev DB).
// Load `.env.test` first so DATABASE_URL points at the isolated test database;
// dotenv never overrides a variable that is already set.
config({ path: '.env.test' });

const testDatabaseUrl = process.env.DATABASE_URL;
const devDatabaseUrl = existsSync('.env') ? parse(readFileSync('.env')).DATABASE_URL : undefined;

if (!testDatabaseUrl) {
  throw new Error('DATABASE_URL is missing. Create backend/.env.test from .env.test.example.');
}
if (testDatabaseUrl === devDatabaseUrl) {
  throw new Error('.env.test points at the dev database. Use a separate carpool_test database.');
}

export default defineConfig({
  test: {
    globalSetup: './test/globalSetup.js',
    // Test files share one database, so run them one at a time.
    fileParallelism: false,
  },
});
