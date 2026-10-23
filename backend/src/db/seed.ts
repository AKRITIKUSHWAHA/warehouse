import bcrypt from 'bcryptjs';
import { db, pool, testDbConnection } from './index.js';
import {
  roles,
  users,
  settings,
  ports,
} from './schema/index.js';
import { ROLES, ROLE_DISPLAY_NAMES } from '../common/constants/roles.js';
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

  console.log('🌱 Seeding standard workflow staff users with hashed passwords...');
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  const initialStaffUsers = [
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
      name: 'Destination Agent Staff',
      email: 'operations@caribbeanexpressbahamas.com',
      roleKey: ROLES.PORT_AGENT,
      department: 'Destination Agency Hub',
      passwordHash: defaultPasswordHash,
      status: 'Active',
      avatar: 'AG',
      phone: '+1 (305) 555-0177',
      agentId: null,
    },
  ];

  for (const user of initialStaffUsers) {
    await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.userCode,
        set: {
          roleKey: user.roleKey,
          email: user.email,
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
    {
      key: 'role_permissions',
      value: {
        super_admin: [
          'dashboard', 'customers', 'warehouse-receipts', 'documents',
          'house-bills', 'consolidations', 'shipments', 'bills-of-lading', 'manifests',
          'vessels', 'tracking', 'agent-portal', 'hold-authorization',
          'history', 'audit', 'users', 'settings'
        ],
        operations: [
          'dashboard', 'customers', 'consolidations', 'shipments', 'bills-of-lading',
          'manifests', 'vessels', 'tracking'
        ],
        warehouse: [
          'dashboard', 'customers', 'warehouse-receipts', 'documents',
          'consolidations', 'tracking'
        ],
        documentation: [
          'dashboard', 'customers', 'warehouse-receipts', 'house-bills',
          'consolidations', 'shipments', 'bills-of-lading', 'manifests', 'tracking',
          'hold-authorization'
        ],
        agent: [
          'dashboard', 'agent-portal', 'manifests', 'consolidations',
          'bills-of-lading', 'tracking', 'documents'
        ]
      },
      description: 'Default role-based menu permissions matching client requirements',
    },
  ];

  for (const setting of systemSettingsToSeed) {
    await db.insert(settings).values(setting).onConflictDoNothing();
  }

  console.log('🌱 Seeding official Eastern Caribbean ports...');
  const easternCaribbeanPorts = [
    { portCode: 'STT', name: 'Port of Charlotte Amalie', island: 'St. Thomas', country: 'U.S. Virgin Islands', defaultAgent: 'VI Customs St. Thomas Agency' },
    { portCode: 'STX', name: 'Port of Christiansted', island: 'St. Croix', country: 'U.S. Virgin Islands', defaultAgent: 'St. Croix Marine Logistics' },
    { portCode: 'STJ', name: 'Cruz Bay Port', island: 'St. John', country: 'U.S. Virgin Islands', defaultAgent: 'Love City Cargo Services' },
    { portCode: 'TOR', name: 'Port Purcell, Road Town', island: 'Tortola', country: 'British Virgin Islands', defaultAgent: 'Tortola Freight Agency' },
    { portCode: 'VG', name: 'Spanish Town Port', island: 'Virgin Gorda', country: 'British Virgin Islands', defaultAgent: 'Virgin Gorda Agency' },
    { portCode: 'SXM', name: 'Port of Philipsburg', island: 'St. Maarten', country: 'Sint Maarten', defaultAgent: 'Caribbean Island Logistics' },
    { portCode: 'AXA', name: 'Road Bay Port', island: 'Anguilla', country: 'Anguilla', defaultAgent: 'Anguilla Port Services' },
    { portCode: 'MIA', name: 'Port of Miami (Miami CFS)', island: 'Florida', country: 'United States', defaultAgent: 'VI Customs Brokers Miami CFS' },
  ];

  for (const p of easternCaribbeanPorts) {
    await db.insert(ports).values(p).onConflictDoNothing();
  }

  console.log('✅ Clean-slate system seed completed: Roles, Settings, Staff Users, and Eastern Caribbean Ports.');
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
