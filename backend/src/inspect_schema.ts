import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
  const tablesRes = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('--- TABLES ---');
  for (const row of tablesRes.rows) {
    console.log(row.table_name);
  }

  const colsRes = await db.execute(sql`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name IN ('house_bills', 'consolidations', 'shipments', 'bills_of_lading', 'manifests', 'tracking_events')
    ORDER BY table_name, ordinal_position;
  `);
  console.log('--- KEY COLUMNS ---');
  for (const row of colsRes.rows) {
    console.log(`${row.table_name}.${row.column_name} (${row.data_type})`);
  }

  const fkRes = await db.execute(sql`
    SELECT
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name 
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `);
  console.log('--- FOREIGN KEYS ---');
  for (const row of fkRes.rows) {
    console.log(`${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
