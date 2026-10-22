import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:root@localhost:5432/wereHouseDb',
});

async function run() {
  await client.connect();

  console.log('--- Scanning tables for Bahamas / Nassau references ---');

  const bl = await client.query(`
    SELECT id, bl_number, ocean_vessel, carrier, port_of_discharge, place_of_delivery 
    FROM bills_of_lading 
    WHERE ocean_vessel ILIKE '%bahama%' 
       OR port_of_discharge ILIKE '%nassau%' 
       OR place_of_delivery ILIKE '%bahama%' 
       OR place_of_delivery ILIKE '%nassau%'
  `);
  console.log('bills_of_lading matches:', bl.rows);

  const con = await client.query(`
    SELECT id, consolidation_number, destination_port 
    FROM consolidations 
    WHERE destination_port ILIKE '%bahama%' OR destination_port ILIKE '%nassau%'
  `);
  console.log('consolidations matches:', con.rows);

  const wr = await client.query(`
    SELECT id, receipt_number, destination_port 
    FROM warehouse_receipts 
    WHERE destination_port ILIKE '%bahama%' OR destination_port ILIKE '%nassau%'
  `);
  console.log('warehouse_receipts matches:', wr.rows);

  const sh = await client.query(`
    SELECT id, shipment_number, vessel_name, carrier, destination_port 
    FROM shipments 
    WHERE vessel_name ILIKE '%bahama%' 
       OR carrier ILIKE '%bahama%' 
       OR destination_port ILIKE '%bahama%' 
       OR destination_port ILIKE '%nassau%'
  `);
  console.log('shipments matches:', sh.rows);

  const pt = await client.query(`
    SELECT id, code, name, country 
    FROM ports 
    WHERE country ILIKE '%bahama%' OR name ILIKE '%nassau%'
  `);
  console.log('ports matches:', pt.rows);

  const u = await client.query(`
    SELECT id, email, name, role_key 
    FROM users 
    WHERE email ILIKE '%bahama%' OR name ILIKE '%bahama%'
  `);
  console.log('users matches:', u.rows);

  await client.end();
}

run().catch(console.error);
