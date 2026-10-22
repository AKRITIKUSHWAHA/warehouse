import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:root@localhost:5432/wereHouseDb',
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL');

  const updateResult = await client.query(`
    UPDATE bills_of_lading
    SET status = 'Released',
        hold_details = jsonb_build_object(
          'isOnHold', false,
          'reason', null,
          'releasedBy', 'Marcus Vance',
          'releasedAt', NOW(),
          'clearanceNotes', 'Hold cleared by operations'
        ),
        updated_at = NOW()
    WHERE bl_number = 'BL-VI-2026-0001'
    RETURNING id, bl_number, status, hold_details;
  `);

  console.log('Updated rows:', updateResult.rows);
  await client.end();
}

main().catch((err) => {
  console.error('Error updating bill of lading hold status:', err);
  process.exit(1);
});
