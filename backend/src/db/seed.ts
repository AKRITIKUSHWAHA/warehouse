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

  console.log('🌱 Seeding standard ports...');
  for (const port of STANDARD_PORTS) {
    await db
      .insert(ports)
      .values({
        portCode: port.code,
        name: port.name,
        island: port.island,
        country: port.country,
        status: 'Active',
      })
      .onConflictDoNothing();
  }

  console.log('🌱 Seeding authentic Caribbean commercial importers (customers)...');
  const initialCustomers = [
    {
      customerNumber: 'CUS-2026-0001',
      name: 'Bahamas Marine Supplies Ltd.',
      companyName: 'Bahamas Marine Supplies Ltd.',
      contactPerson: 'Capt. Arthur Rolle',
      email: 'arolle@bahamasmarine.com',
      telephone: '+1 (242) 393-8821',
      phone: '+1 (242) 393-8821',
      address: 'East Bay Street, Nassau, New Providence',
      destinationPort: 'Port of Nassau (BSNAS)',
      destinationCode: 'NAS',
      taxId: 'BS-TIN-882910',
      accountType: 'Commercial Importer',
      creditTerms: 'Net 30',
      status: 'Active',
      notes: 'Priority marine spare parts & outboard logistics client.',
    },
    {
      customerNumber: 'CUS-2026-0002',
      name: 'Caribbean Hardware & Lumber Co.',
      companyName: 'Caribbean Hardware & Lumber Co.',
      contactPerson: 'David Knowles',
      email: 'dknowles@caribbeanhardware.com',
      telephone: '+1 (242) 352-7740',
      phone: '+1 (242) 352-7740',
      address: "Queen's Highway, Freeport, Grand Bahama",
      destinationPort: 'Port of Freeport (BSFPO)',
      destinationCode: 'FPO',
      taxId: 'BS-TIN-449102',
      accountType: 'Wholesaler',
      creditTerms: 'Net 30',
      status: 'Active',
      notes: 'Heavy building materials and hardware wholesaler.',
    },
    {
      customerNumber: 'CUS-2026-0003',
      name: 'Exuma Cays Provisions & Logistics',
      companyName: 'Exuma Cays Provisions & Logistics',
      contactPerson: 'Marcus Bethel',
      email: 'mbethel@exumaprovisions.com',
      telephone: '+1 (242) 336-2210',
      phone: '+1 (242) 336-2210',
      address: "Queen's Highway, George Town, Exuma",
      destinationPort: 'Port of George Town (BSGGT)',
      destinationCode: 'GGT',
      taxId: 'BS-TIN-330198',
      accountType: 'Commercial Importer',
      creditTerms: 'Net 15',
      status: 'Active',
      notes: 'Exuma yacht provisioning and resort supplies.',
    },
    {
      customerNumber: 'CUS-2026-0004',
      name: 'Abaco Building Materials Depot',
      companyName: 'Abaco Building Materials Depot',
      contactPerson: 'Emanuel Albury',
      email: 'ealbury@abacobuilding.com',
      telephone: '+1 (242) 367-2900',
      phone: '+1 (242) 367-2900',
      address: 'Don MacKay Blvd, Marsh Harbour, Abaco',
      destinationPort: 'Marsh Harbour Port (BSMHH)',
      destinationCode: 'MHH',
      taxId: 'BS-TIN-991204',
      accountType: 'Wholesaler',
      creditTerms: 'Net 30',
      status: 'Active',
      notes: 'Lumber and roofing materials distributor in Abaco.',
    },
    {
      customerNumber: 'CUS-2026-0005',
      name: 'Eleuthera Hospitality Imports',
      companyName: 'Eleuthera Hospitality Imports',
      contactPerson: 'Claire Symonette',
      email: 'csymonette@eleutheraimports.com',
      telephone: '+1 (242) 335-1440',
      phone: '+1 (242) 335-1440',
      address: "Main Street, Governor's Harbour, Eleuthera",
      destinationPort: "Governor's Harbour (BSGHB)",
      destinationCode: 'GHB',
      taxId: 'BS-TIN-774011',
      accountType: 'Commercial Importer',
      creditTerms: 'Prepaid',
      status: 'Active',
      notes: 'Hospitality, linen and kitchen equipment importer.',
    },
    {
      customerNumber: 'CUS-2026-0006',
      name: 'Paradise Island Resort Provisions',
      companyName: 'Paradise Island Resort Provisions Ltd.',
      contactPerson: 'Julian Ferguson',
      email: 'jferguson@paradiseresorts.com',
      telephone: '+1 (242) 363-3000',
      phone: '+1 (242) 363-3000',
      address: 'Casino Drive, Paradise Island, Bahamas',
      destinationPort: 'Port of Nassau (BSNAS)',
      destinationCode: 'NAS',
      taxId: 'BS-TIN-119283',
      accountType: 'Commercial Importer',
      creditTerms: 'Net 30',
      status: 'Active',
      notes: 'Hotel & luxury hospitality consumables client.',
    },
  ];

  for (const customer of initialCustomers) {
    await db.insert(customers).values(customer).onConflictDoNothing();
  }

  console.log('🌱 Seeding port destination agents...');
  const initialAgents = [
    {
      agentCode: 'AGT-001',
      name: 'Caribbean Express Freight Ltd.',
      contactPerson: 'David Cartwright',
      email: 'operations@caribbeanexpressbahamas.com',
      phone: '+1 (242) 555-9000',
      territory: 'Nassau & Freeport (Bahamas)',
      address: 'Arawak Cay Port Terminal, Nassau, Bahamas',
      assignedPortCode: 'NAS',
      status: 'Active',
      rating: '5.0/5',
      creditLimitUsd: '50000.00',
      currentBalanceUsd: '0.00',
      lastActivity: 'Active Inbound Handling',
    },
    {
      agentCode: 'AGT-002',
      name: 'Grand Bahama Port Logistics Agency',
      contactPerson: 'Trevor Sands',
      email: 'ops@gbportlogistics.com',
      phone: '+1 (242) 352-9110',
      territory: 'Freeport Industrial Zone',
      address: 'Freeport Harbour Yard, Grand Bahama',
      assignedPortCode: 'FPO',
      status: 'Active',
      rating: '4.9/5',
      creditLimitUsd: '35000.00',
      currentBalanceUsd: '4500.00',
      lastActivity: 'Active',
    },
    {
      agentCode: 'AGT-003',
      name: 'Abaco Maritime Services',
      contactPerson: 'Sarah Albury',
      email: 'clearing@abacomaritime.com',
      phone: '+1 (242) 367-4402',
      territory: 'Marsh Harbour & Cays',
      address: 'Port Dock Road, Marsh Harbour, Abaco',
      assignedPortCode: 'MHH',
      status: 'Active',
      rating: '4.7/5',
      creditLimitUsd: '20000.00',
      currentBalanceUsd: '1800.00',
      lastActivity: 'Active',
    },
    {
      agentCode: 'AGT-004',
      name: 'Exuma Harbor Cargo Agency',
      contactPerson: 'Kenron Rolle',
      email: 'agent@exumacargo.com',
      phone: '+1 (242) 336-9920',
      territory: 'George Town Harbour',
      address: 'Commercial Dock, George Town, Exuma',
      assignedPortCode: 'GGT',
      status: 'Active',
      rating: '4.8/5',
      creditLimitUsd: '25000.00',
      currentBalanceUsd: '2100.00',
      lastActivity: 'Active',
    },
  ];

  let primaryAgentId: string | undefined = undefined;
  for (const agent of initialAgents) {
    const [inserted] = await db
      .insert(agents)
      .values(agent)
      .onConflictDoUpdate({
        target: agents.agentCode,
        set: {
          name: agent.name,
          contactPerson: agent.contactPerson,
          email: agent.email,
          phone: agent.phone,
          territory: agent.territory,
          address: agent.address,
          assignedPortCode: agent.assignedPortCode,
          status: agent.status,
          rating: agent.rating,
          creditLimitUsd: agent.creditLimitUsd,
          currentBalanceUsd: agent.currentBalanceUsd,
          lastActivity: agent.lastActivity,
        },
      })
      .returning();
    if (inserted && inserted.agentCode === 'AGT-001') {
      primaryAgentId = inserted.id;
    }
  }

  // If already existed, fetch its ID
  if (!primaryAgentId) {
    const existingAgent = await db.query.agents.findFirst({
      where: (a, { eq }) => eq(a.agentCode, 'AGT-001'),
    });
    if (existingAgent) primaryAgentId = existingAgent.id;
  }

  console.log('🌱 Seeding container fleet...');
  const initialContainers = [
    {
      containerNumber: 'MSKU-829104-5',
      type: "40' High Cube Dry",
      carrier: 'Maersk Line / Tropical',
      sealNumber: 'SEAL-VI-8821',
      tareWeightKg: '3880.00',
      maxPayloadKg: '28620.00',
      maxVolumeCbm: '76.20',
      loadedWeightKg: '54.40',
      loadedVolumeCbm: '0.52',
      fillPercentage: '1.00',
      status: 'Available at CFS Yard',
      location: 'Miami CFS Yard - Bay A',
      originPort: 'Port of Miami (USMIA)',
      dischargePort: 'Port of Nassau (BSNAS)',
      temperatureControlled: false,
    },
    {
      containerNumber: 'TGHU-918234-0',
      type: "20' Standard GP",
      carrier: 'Tropical Shipping Line',
      sealNumber: 'SEAL-VI-9902',
      tareWeightKg: '2230.00',
      maxPayloadKg: '21770.00',
      maxVolumeCbm: '33.20',
      loadedWeightKg: '0.00',
      loadedVolumeCbm: '0.00',
      fillPercentage: '0.00',
      status: 'Available at CFS Yard',
      location: 'Miami CFS Yard - Bay B',
      originPort: 'Port of Miami (USMIA)',
      dischargePort: 'Port of Freeport (BSFPO)',
      temperatureControlled: false,
    },
    {
      containerNumber: 'MEDU-440219-3',
      type: "40' High Cube Dry",
      carrier: 'MSC Mediterranean',
      sealNumber: 'SEAL-VI-1029',
      tareWeightKg: '3900.00',
      maxPayloadKg: '28600.00',
      maxVolumeCbm: '76.20',
      loadedWeightKg: '0.00',
      loadedVolumeCbm: '0.00',
      fillPercentage: '0.00',
      status: 'Available at CFS Yard',
      location: 'Miami CFS Yard - Bay C',
      originPort: 'Port of Miami (USMIA)',
      dischargePort: 'Port of Nassau (BSNAS)',
      temperatureControlled: false,
    },
    {
      containerNumber: 'CMAU-772109-1',
      type: "40' Reefer High Cube",
      carrier: 'CMA CGM',
      sealNumber: 'SEAL-VI-3341',
      tareWeightKg: '4500.00',
      maxPayloadKg: '27500.00',
      maxVolumeCbm: '67.00',
      loadedWeightKg: '0.00',
      loadedVolumeCbm: '0.00',
      fillPercentage: '0.00',
      status: 'Available at CFS Yard',
      location: 'Miami CFS Yard - Reefer Bay',
      originPort: 'Port of Miami (USMIA)',
      dischargePort: 'Port of Nassau (BSNAS)',
      temperatureControlled: true,
    },
  ];

  for (const container of initialContainers) {
    await db.insert(containers).values(container).onConflictDoNothing();
  }

  console.log('🌱 Seeding commercial vessels and voyages...');
  const initialVessels = [
    {
      name: 'MV Caribbean Star',
      imoNumber: '9482019',
      flag: 'Bahamas',
      type: 'Container Feeder',
      carrier: 'Tropical Shipping Line',
      capacityTeu: 1100,
      deadweightTonnage: 12500,
      builtYear: 2018,
      status: 'Active',
      currentVoyage: 'V.2026-35S',
      activeRoute: 'Miami CFS -> Nassau -> Freeport',
      etaNextPort: '2026-10-06',
    },
    {
      name: 'Tropical Island Voyager',
      imoNumber: '9314052',
      flag: 'Panama',
      type: 'Geared Container Vessel',
      carrier: 'Seaboard Marine',
      capacityTeu: 850,
      deadweightTonnage: 9800,
      builtYear: 2015,
      status: 'Active',
      currentVoyage: 'V.2026-42E',
      activeRoute: 'Miami CFS -> George Town -> Marsh Harbour',
      etaNextPort: '2026-10-08',
    },
  ];

  for (const vessel of initialVessels) {
    const [insertedVessel] = await db.insert(vessels).values(vessel).onConflictDoNothing().returning();
    const vesselId = insertedVessel?.id;
    if (vesselId && vessel.imoNumber === '9482019') {
      await db.insert(voyages).values({
        voyageNumber: 'V.2026-35S',
        vesselId,
        vesselName: vessel.name,
        carrier: vessel.carrier,
        originPort: 'Port of Miami (USMIA)',
        destinationPort: 'Port of Nassau (BSNAS)',
        departureDate: '2026-10-02',
        arrivalDate: '2026-10-06',
        status: 'Scheduled',
        assignedShipmentsCount: 2,
        totalTeuUtilized: '2.00',
      }).onConflictDoNothing();
    }
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
      department: 'Vessel Operations & Consolidations',
      passwordHash: defaultPasswordHash,
      status: 'Active',
      avatar: 'ER',
      phone: '+1 (305) 555-0199',
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
      name: 'David Cartwright',
      email: 'operations@caribbeanexpressbahamas.com',
      roleKey: ROLES.PORT_AGENT,
      department: 'Caribbean Express Freight Ltd. (Bahamas)',
      agentId: primaryAgentId,
      passwordHash: defaultPasswordHash,
      status: 'Active',
      avatar: 'DC',
      phone: '+1 (242) 555-9000',
    },
    {
      userCode: 'USR-005',
      name: 'Elena Rostova',
      email: 'elena.r@vicustoms.com',
      roleKey: ROLES.OPERATIONS,
      department: 'Vessel Operations & Consolidations',
      passwordHash: defaultPasswordHash,
      status: 'Active',
      avatar: 'ER',
      phone: '+1 (305) 555-0199',
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
