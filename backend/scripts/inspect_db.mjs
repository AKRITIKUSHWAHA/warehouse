import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB:', client.database);
    
    // Check tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Current Tables:', tablesRes.rows.map(r => r.table_name));

    try {
      const migRes = await client.query('SELECT * FROM "__drizzle_migrations"');
      console.log('Drizzle migrations in DB:', migRes.rows);
    } catch (e) {
      console.log('No __drizzle_migrations table or error:', e.message);
    }
    const checkTables = [
      'users', 'roles', 'settings', 'ports', 'customers', 'vessels',
      'warehouse_receipts', 'cargo', 'house_bills', 'consolidations',
      'shipments', 'bills_of_lading', 'manifests', 'documents',
      'tracking_events', 'audit_logs', 'containers', 'voyages'
    ];

    for (const tbl of checkTables) {
      try {
        const countRes = await client.query(`SELECT count(*) FROM "${tbl}"`);
        console.log(`Table ${tbl}: ${countRes.rows[0].count} rows`);
      } catch (err) {
        console.log(`Table ${tbl}: does not exist or error (${err.message})`);
      }
    }

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

run();
