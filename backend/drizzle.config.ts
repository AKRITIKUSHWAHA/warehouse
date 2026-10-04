import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  dialect: 'postgresql',
  schema: './dist/src/db/schema/index.js',
  out: './drizzle/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:root@localhost:5432/Warhouse',
  },
  verbose: true,
  strict: true,
});
