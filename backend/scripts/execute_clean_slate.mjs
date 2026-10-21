import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function executeCleanSlate() {
  try {
    await client.connect();
    console.log('✅ Connected to database:', client.database);

    // 1. Run the migration SQL statements
    const migrationFile = path.resolve('./drizzle/migrations/0002_clean_slate_simplification.sql');
    const sqlContent = fs.readFileSync(migrationFile, 'utf8');
    const statements = sqlContent
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`\n⏳ Executing ${statements.length} migration statements from 0002_clean_slate_simplification.sql...`);
    for (const stmt of statements) {
      console.log(`Running: ${stmt.replace(/\n/g, ' ')}`);
      await client.query(stmt);
    }
    console.log('✅ Migration statements executed successfully!');

    // 2. Clear FK references in users just in case
    await client.query(`UPDATE users SET agent_id = NULL WHERE agent_id IS NOT NULL`);

    // 3. Purge all test / dummy / Bahamas operational data
    console.log('\n⏳ Purging all test, dummy, and operational data (keeping only roles, settings, users)...');
    await client.query(`
      TRUNCATE TABLE 
        audit_logs,
        tracking_events,
        documents,
        manifests,
        bills_of_lading,
        shipments,
        consolidations,
        house_bills,
        cargo,
        warehouse_receipts,
        customers,
        vessels,
        ports,
        agents
      CASCADE;
    `);
    console.log('✅ Operational tables truncated successfully!');

    // 4. Check all tables and counts
    const checkTables = [
      'roles', 'settings', 'users', 'ports', 'customers', 'vessels',
      'warehouse_receipts', 'cargo', 'house_bills', 'consolidations',
      'shipments', 'bills_of_lading', 'manifests', 'documents',
      'tracking_events', 'audit_logs', 'agents'
    ];

    console.log('\n📊 Verifying row counts:');
    for (const tbl of checkTables) {
      try {
        const res = await client.query(`SELECT count(*) FROM "${tbl}"`);
        console.log(`  - ${tbl.padEnd(22)}: ${res.rows[0].count} rows`);
      } catch (err) {
        console.log(`  - ${tbl.padEnd(22)}: ERROR (${err.message})`);
      }
    }

    // Confirm containers and voyages are dropped
    const checkDropped = ['containers', 'voyages'];
    for (const tbl of checkDropped) {
      const res = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        );
      `, [tbl]);
      console.log(`  - ${tbl.padEnd(22)}: ${res.rows[0].exists ? 'STILL EXISTS (FAIL)' : 'DROPPED (PASS)'}`);
    }

  } catch (err) {
    console.error('❌ Error executing clean slate:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

executeCleanSlate();
