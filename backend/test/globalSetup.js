import { execSync } from 'node:child_process';

// Runs once before the suite. DATABASE_URL already points at the test DB
// (set in vitest.config.js), so the reset can never touch the dev database.
// The reset creates the database if needed and applies every migration.
export default function setup() {
  execSync('npx prisma migrate reset --force --skip-seed', {
    stdio: 'inherit',
    env: process.env,
  });
}
