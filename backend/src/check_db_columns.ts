import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
  const r = await db.execute(
    sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'consolidations' ORDER BY ordinal_position`
  );
  console.log('consolidations columns:', r.rows.map((x: any) => x.column_name));

  const wr = await db.execute(
    sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'warehouse_receipts' ORDER BY ordinal_position`
  );
  console.log('warehouse_receipts columns:', wr.rows.map((x: any) => x.column_name));

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
