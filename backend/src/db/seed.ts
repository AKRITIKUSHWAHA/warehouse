import bcrypt from 'bcryptjs';
import { db, pool, testDbConnection } from './index.js';
import {
  roles,
  ports,
  users,
  agents,
  settings,
  customers,
  containers,
  vessels,
  voyages,
} from './schema/index.js';
import { ROLES, ROLE_DISPLAY_NAMES } from '../common/constants/roles.js';
import { STANDARD_PORTS } from '../common/constants/ports.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

export async function seedDatabase(): Promise<void> {
  console.log('🌱 Checking PostgreSQL connection before seeding...');
  const isConnected = await testDbConnection();
  if (!isConnected.connected) {
    throw new Error('Database connection failed. Please ensure PostgreSQL is running.');
  }

  console.log('🌱 Seeding roles...');
  for (const roleKey of Object.values(ROLES)) {
    await db
      .insert(roles)
      .values({
        roleKey,
        roleName: ROLE_DISPLAY_NAMES[roleKey],
        description: `Default system role for ${ROLE_DISPLAY_NAMES[roleKey]}`,
      })
      .onConflictDoNothing();
  }

  console.log('🌱 Ports table starts EMPTY (fully dynamic, managed via admin)...');
  // No hardcoded ports seeded. Ports table starts empty.

  console.log('🌱 Customers table starts clean (no Bahamas seed records)...');
  // No Bahamas commercial importers seeded.

  console.log('🌱 Destination agents table starts clean...');
  let primaryAgentId: string | undefined = undefined;

  console.log('🌱 Containers table starts clean...');
  // Containers will be managed on-demand per client workflow.

  console.log('🌱 Seeding sample vessels...');
  const initialVessels = [
    {
      name: 'MV Caribbean Star',
      imoNumber: '9482019',
      flag: 'Panama',
      type: 'Feeder Boat',
      carrier: 'Regional Logistics',
      capacityTeu: 150,
      deadweightTonnage: 2500,
      builtYear: 2018,
      status: 'Active',
      currentVoyage: 'V.2026-01',
      activeRoute: 'Eastern Caribbean Feeder',
      etaNextPort: '2026-10-06',
    },
    {
      name: 'Island Trader',
      imoNumber: '9314052',
      flag: 'Panama',
      type: 'Feeder Boat',
      carrier: 'Regional Logistics',
      capacityTeu: 120,
      deadweightTonnage: 1800,
      builtYear: 2015,
      status: 'Active',
      currentVoyage: 'V.2026-02',
      activeRoute: 'Eastern Caribbean Feeder',
      etaNextPort: '2026-10-08',
    },
  ];

  for (const vessel of initialVessels) {
    await db.insert(vessels).values(vessel).onConflictDoNothing();
  }

  console.log('🌱 Seeding standard workflow users with hashed passwords...');
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  const initialUsersToSeed = [
    {
      userCode: 'USR-001',
      name: 'Marcus Vance',
      email: 'marcus.vance@vicustoms.com',
      roleKey: ROLES.SUPER_ADMIN,
      department: 'Executive & Global Operations',
      passwordHash: defaultPasswordHash,
      status: 'Active',
      avatar: 'MV',
      phone: '+1 (305) 555-0100',
      agentId: null,
    },
    {
      userCode: 'USR-005',
      name: 'Elena Rostova',
      email: 'elena.r@vicustoms.com',
      roleKey: ROLES.OPERATIONS,
      department: 'Operations & Consolidations',
      passwordHash: defaultPasswordHash,
      status: 'Active',
      avatar: 'ER',
      phone: '+1 (305) 555-0199',
      agentId: null,
    },
    {
      userCode: 'USR-002',
      name: 'Sarah Jenkins',
      email: 'sarah.j@vicustoms.com',
      roleKey: ROLES.DOCUMENTATION_STAFF,
      department: 'B/L Documentation & Billing',
      passwordHash: defaultPasswordHash,
      status: 'Active',
      avatar: 'SJ',
      phone: '+1 (305) 555-0142',
      agentId: null,
    },
    {
      userCode: 'USR-003',
      name: 'Carlos Mendez',
      email: 'carlos.m@vicustoms.com',
      roleKey: ROLES.WAREHOUSE,
      department: 'Miami CFS Warehouse',
      passwordHash: defaultPasswordHash,
      status: 'Active',
      avatar: 'CM',
      phone: '+1 (305) 555-0188',
      agentId: null,
    },
    {
      userCode: 'USR-004',
      name: 'Regional Agent',
      email: 'agent@vicustoms.com',
      roleKey: ROLES.PORT_AGENT,
      department: 'Destination Agent Operations',
      agentId: null,
      passwordHash: defaultPasswordHash,
      status: 'Active',
      avatar: 'RA',
      phone: '+1 (305) 555-0150',
    },
  ];

  for (const user of initialUsersToSeed) {
    await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          roleKey: user.roleKey,
          agentId: user.agentId,
          name: user.name,
          department: user.department,
          status: user.status,
          passwordHash: user.passwordHash,
        },
      });
  }

  console.log('🌱 Seeding full system settings (Branding, Sequences, Labels, Units)...');
  const systemSettingsToSeed = [
    {
      key: 'numberingRules',
      value: {
        warehouseReceiptPrefix: 'WR-2026-',
        warehouseReceiptStart: 3100,
        houseBillPrefix: 'HBL-2026-',
        billOfLadingPrefix: 'BL-VI-2026-',
        shipmentPrefix: 'SHP-2026-',
        consolidationPrefix: 'CNS-2026-',
        manifestPrefix: 'MNF-2026-',
      },
      description: 'System-wide document and receipt numbering rules',
    },
    {
      key: 'companyProfile',
      value: {
        companyName: 'VI Customs Brokers & Logistics',
        legalName: 'VI Customs Brokers & Logistics Inc.',
        taxId: 'EIN-59-9948210',
        fmcNumber: 'FMC-OTI #028914N',
        addressLine1: '8400 NW 36th Street, Suite 500',
        city: 'Miami',
        state: 'Florida',
        zipCode: '33166',
        country: 'United States',
        phone: '+1 (305) 555-5377',
        email: 'operations@vicustoms.com',
      },
      description: 'Official corporate branding, FMC license and Miami CFS contact info',
    },
    {
      key: 'labelSettings',
      value: {
        rollSize: '4x6',
        barcodeType: 'Code 128',
        primaryMeasurement: 'CFT',
        includeQrCode: true,
        includeHandlingIcons: true,
      },
      description: 'Miami CFS thermal label printer and barcode specifications',
    },
    {
      key: 'unitsAndCurrencies',
      value: {
        defaultWeightUnit: 'LBS',
        defaultVolumeUnit: 'CFT (Primary) / CBM',
        defaultCurrency: 'USD ($)',
      },
      description: 'Maritime freight standard calculation units and trade currency',
    },
  ];

  for (const setting of systemSettingsToSeed) {
    await db.insert(settings).values(setting).onConflictDoNothing();
  }

  console.log('✅ Master system setup finished successfully (Seeded commercial entities and workflow users).');
}

// Allow direct execution
if (process.argv[1] === __filename) {
  seedDatabase()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('❌ Seeding failed:', err);
      await pool.end();
      process.exit(1);
    });
}
