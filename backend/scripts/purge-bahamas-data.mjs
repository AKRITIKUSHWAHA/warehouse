import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:root@localhost:5432/wereHouseDb',
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL wereHouseDb');

  // 1. Delete bills_of_lading with MV Bahama Express or Bahamas discharge port
  const delBL = await client.query(`
    DELETE FROM bills_of_lading 
    WHERE ocean_vessel ILIKE '%bahama%' 
       OR port_of_discharge ILIKE '%nassau%' 
       OR place_of_delivery ILIKE '%bahama%'
    RETURNING id, bl_number, ocean_vessel;
  `);
  console.log('Deleted bills_of_lading:', delBL.rows);

  // 2. Delete consolidations with Bahamas destination
  const delCon = await client.query(`
    DELETE FROM consolidations 
    WHERE destination_port ILIKE '%bahama%' OR destination_port ILIKE '%nassau%'
    RETURNING id, consolidation_number, destination_port;
  `);
  console.log('Deleted consolidations:', delCon.rows);

  // 3. Delete warehouse_receipts with Bahamas destination
  const delWR = await client.query(`
    DELETE FROM warehouse_receipts 
    WHERE destination_port ILIKE '%bahama%' OR destination_port ILIKE '%nassau%'
    RETURNING id, receipt_number, destination_port;
  `);
  console.log('Deleted warehouse_receipts:', delWR.rows);

  // 4. Delete shipments linked to old Bahamas records if any
  const delShp = await client.query(`
    DELETE FROM shipments 
    WHERE destination_port ILIKE '%bahama%' 
       OR destination_port ILIKE '%nassau%' 
       OR vessel_name ILIKE '%bahama%'
    RETURNING id, shipment_number;
  `);
  console.log('Deleted shipments:', delShp.rows);

  // 5. Delete Bahamas ports (NAS, FPO, MHH, GGT, ELH)
  const delPorts = await client.query(`
    DELETE FROM ports 
    WHERE country ILIKE '%bahama%' OR port_code IN ('NAS', 'FPO', 'MHH', 'GGT', 'ELH')
    RETURNING port_code, name, country;
  `);
  console.log('Deleted Bahamas ports:', delPorts.rows);

  // 6. Update agent user to Eastern Caribbean (St. Thomas) instead of Bahamas
  const updateAgent = await client.query(`
    UPDATE users 
    SET email = 'agent.stt@vicustoms.com',
        department = 'St. Thomas Hub (STT) & Eastern Caribbean'
    WHERE email ILIKE '%bahama%'
    RETURNING id, email, department;
  `);
  console.log('Updated agent users:', updateAgent.rows);

  await client.end();
  console.log('Database cleanup of Bahamas data completed successfully.');
}

main().catch(err => {
  console.error('Error during database purge:', err);
  process.exit(1);
});
