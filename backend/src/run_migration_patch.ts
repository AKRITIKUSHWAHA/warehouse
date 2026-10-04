import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Running pending migrations for cargo table...');

  await db.execute(sql`
    ALTER TABLE cargo
    ADD COLUMN IF NOT EXISTS agent_id UUID,
    ADD COLUMN IF NOT EXISTS agent_name TEXT
  `);

  console.log('✅ agent_id and agent_name columns added to cargo');

  const r = await db.execute(
    sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'cargo' ORDER BY ordinal_position`
  );
  console.log('Updated cargo columns:', r.rows.map((x: any) => x.column_name));

  process.exit(0);
}

main().catch(e => { console.error('Migration failed:', e); process.exit(1); });
