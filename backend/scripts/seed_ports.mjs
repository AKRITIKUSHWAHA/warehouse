import pg from 'pg';

async function main() {
  const client = new pg.Client({
    connectionString: 'postgresql://postgres:123@localhost:5432/wereHouseDb',
  });
  await client.connect();

  const portsData = [
    { code: 'STT', name: 'Port of Charlotte Amalie', island: 'St. Thomas', country: 'U.S. Virgin Islands', agent: 'VI Customs St. Thomas Agency' },
    { code: 'STX', name: 'Port of Christiansted', island: 'St. Croix', country: 'U.S. Virgin Islands', agent: 'St. Croix Marine Logistics' },
    { code: 'STJ', name: 'Cruz Bay Port', island: 'St. John', country: 'U.S. Virgin Islands', agent: 'Love City Cargo Services' },
    { code: 'TOR', name: 'Port Purcell, Road Town', island: 'Tortola', country: 'British Virgin Islands', agent: 'Tortola Freight Agency' },
    { code: 'VG', name: 'Spanish Town Port', island: 'Virgin Gorda', country: 'British Virgin Islands', agent: 'Virgin Gorda Agency' },
    { code: 'SXM', name: 'Port of Philipsburg', island: 'St. Maarten', country: 'Sint Maarten', agent: 'Caribbean Island Logistics' },
    { code: 'AXA', name: 'Road Bay Port', island: 'Anguilla', country: 'Anguilla', agent: 'Anguilla Port Services' },
    { code: 'MIA', name: 'Port of Miami (Miami CFS)', island: 'Florida', country: 'United States', agent: 'VI Customs Brokers Miami CFS' },
  ];

  for (const p of portsData) {
    await client.query(
      `INSERT INTO ports (id, port_code, name, island, country, status, default_agent)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'Active', $5)
       ON CONFLICT (port_code) DO UPDATE
       SET name = EXCLUDED.name, island = EXCLUDED.island, country = EXCLUDED.country, default_agent = EXCLUDED.default_agent`,
      [p.code, p.name, p.island, p.country, p.agent]
    );
  }

  const res = await client.query('SELECT port_code, name, island, country FROM ports ORDER BY port_code');
  console.log('✅ Successfully seeded ports in wereHouseDb:');
  console.table(res.rows);

  await client.end();
}

main().catch(err => {
  console.error('Failed to seed ports:', err);
  process.exit(1);
});
