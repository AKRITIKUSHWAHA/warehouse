const BASE_URL = 'http://localhost:5001/api/v1';

const DEFAULT_PASS = process.env.STAFF_PASSWORD || 'password123';

const PERSONAS = [
  { name: 'Marcus Vance', role: 'Super Admin', email: 'marcus.vance@vicustoms.com', password: DEFAULT_PASS },
  { name: 'Elena Rostova', role: 'Operations', email: 'elena.r@vicustoms.com', password: DEFAULT_PASS },
  { name: 'Sarah Jenkins', role: 'Documentation Staff', email: 'sarah.j@vicustoms.com', password: DEFAULT_PASS },
  { name: 'Carlos Mendez', role: 'Warehouse', email: 'carlos.m@vicustoms.com', password: DEFAULT_PASS },
  { name: 'Destination Agent', role: 'Port Agent', email: 'agent@vicustoms.com', password: DEFAULT_PASS },
];

async function runVerification() {
  console.log('🚀 Starting Full Clean-Slate E2E Verification\n');
  const results = [];

  let superAdminToken = '';

  // 1. Test Login for all 5 personas
  console.log('--- 1. Testing Staff Personas Authentication ---');
  for (const persona of PERSONAS) {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: persona.email, password: persona.password }),
      });
      const data = await res.json();
      const token = data.data?.token || data.token;
      if (res.ok && data.success && token) {
        console.log(`  ✅ Login PASS: ${persona.name} (${persona.role}) -> Token received`);
        results.push({ step: `Auth: ${persona.name} (${persona.role})`, status: 'PASS' });
        if (persona.email === 'marcus.vance@vicustoms.com') {
          superAdminToken = token;
        }
      } else {
        console.error(`  ❌ Login FAIL: ${persona.name} (${persona.role})`, data);
        results.push({ step: `Auth: ${persona.name} (${persona.role})`, status: 'FAIL', error: data });
      }
    } catch (e) {
      console.error(`  ❌ Login ERROR: ${persona.name}`, e.message);
      results.push({ step: `Auth: ${persona.name}`, status: 'FAIL', error: e.message });
    }
  }

  if (!superAdminToken) {
    console.error('Super Admin token missing, aborting lifecycle tests.');
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${superAdminToken}`,
  };

  let vesselId = '';
  let customerId = '';
  let warehouseReceiptId = '';
  let houseBillId = '';
  let consolidationId = '';
  let masterBlId = '';
  let manifestId = '';

  // 2. Create Vessel in Fleet Directory
  console.log('\n--- 2. Creating Vessel in Fleet Directory ---');
  try {
    const vesselPayload = {
      name: 'Atlantic Pioneer',
      type: 'Feeder Container Vessel',
      carrier: 'Tropical Shipping',
      notes: 'Miami to St. Thomas feeder service',
    };
    const res = await fetch(`${BASE_URL}/vessels`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(vesselPayload),
    });
    const data = await res.json();
    if (res.status === 201 && data.success) {
      vesselId = data.data.id;
      console.log(`  ✅ Vessel PASS: Created "${data.data.name}" (ID: ${vesselId})`);
      results.push({ step: 'Create Vessel (Fleet Directory)', status: 'PASS', id: vesselId });
    } else {
      console.error('  ❌ Vessel FAIL:', data);
      results.push({ step: 'Create Vessel', status: 'FAIL', error: data });
    }
  } catch (e) {
    console.error('  ❌ Vessel ERROR:', e.message);
    results.push({ step: 'Create Vessel', status: 'FAIL', error: e.message });
  }

  // 3. Create Customer (Unified Customers)
  console.log('\n--- 3. Creating Unified Customer ---');
  try {
    const customerPayload = {
      name: 'Island Supermarket Ltd',
      companyName: 'Island Supermarket Ltd',
      contactPerson: 'Robert Sterling',
      email: 'robert@islandgroceries.vi',
      phone: '+1 (340) 774-1234',
      address: 'Veterans Drive, Charlotte Amalie, St. Thomas, VI 00802',
      destinationPort: 'STT - Charlotte Amalie, St. Thomas',
      destinationCode: 'STT',
      accountType: 'Commercial Customer',
      creditTerms: 'Net 30',
      notes: 'Primary grocery importer for St. Thomas',
    };
    const res = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(customerPayload),
    });
    const data = await res.json();
    if (res.status === 201 && data.success) {
      customerId = data.data.id;
      console.log(`  ✅ Customer PASS: Created "${data.data.name}" (${data.data.customerNumber})`);
      results.push({ step: 'Create Customer (Unified)', status: 'PASS', id: customerId });
    } else {
      console.error('  ❌ Customer FAIL:', data);
      results.push({ step: 'Create Customer', status: 'FAIL', error: data });
    }
  } catch (e) {
    console.error('  ❌ Customer ERROR:', e.message);
    results.push({ step: 'Create Customer', status: 'FAIL', error: e.message });
  }

  // 4. Create Warehouse Receipt
  console.log('\n--- 4. Creating Warehouse Receipt ---');
  try {
    const wrPayload = {
      customerId,
      customerName: 'Island Supermarket Ltd',
      shipper: 'Miami Food Distributors Inc.',
      consignee: 'Island Supermarket Ltd',
      destinationPort: 'STT - Charlotte Amalie, St. Thomas',
      destinationCode: 'STT',
      cargoDescription: 'Pallets of Dry Groceries & Beverages',
      packageCount: 2,
      totalPieces: 48,
      packageType: 'Pallet',
      weightLbs: 2400,
      totalCft: 180,
      warehouseLocation: 'Bay A-1 (CFS Staging)',
      status: 'Ready for Consolidation',
      packages: [
        {
          packageType: 'Pallet',
          description: 'Dry canned foods',
          lengthInches: 48,
          widthInches: 40,
          heightInches: 60,
          weightLbs: 1200,
          pieces: 24,
          cft: 90,
        },
        {
          packageType: 'Pallet',
          description: 'Beverages in cartons',
          lengthInches: 48,
          widthInches: 40,
          heightInches: 60,
          weightLbs: 1200,
          pieces: 24,
          cft: 90,
        },
      ],
    };
    const res = await fetch(`${BASE_URL}/warehouse-receipts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(wrPayload),
    });
    const data = await res.json();
    if (res.status === 201 && data.success) {
      warehouseReceiptId = data.data.id;
      console.log(`  ✅ Warehouse Receipt PASS: Created "${data.data.receiptNumber}" (ID: ${warehouseReceiptId})`);
      results.push({ step: 'Create Warehouse Receipt', status: 'PASS', id: warehouseReceiptId });
    } else {
      console.error('  ❌ Warehouse Receipt FAIL:', data);
      results.push({ step: 'Create Warehouse Receipt', status: 'FAIL', error: data });
    }
  } catch (e) {
    console.error('  ❌ Warehouse Receipt ERROR:', e.message);
    results.push({ step: 'Create Warehouse Receipt', status: 'FAIL', error: e.message });
  }

  // 5. Create House Bill of Lading (HBL)
  console.log('\n--- 5. Creating House Bill of Lading (HBL) ---');
  try {
    const hblPayload = {
      customerId,
      customerName: 'Island Supermarket Ltd',
      shipper: { name: 'Miami Food Distributors Inc.', address: '1200 NW 72nd Ave, Miami FL' },
      consignee: { name: 'Island Supermarket Ltd', address: 'Veterans Drive, Charlotte Amalie, St. Thomas' },
      originPort: 'Port of Miami (USMIA), FL',
      destinationPort: 'Port of Charlotte Amalie (VISTT), St. Thomas',
      destinationCode: 'STT',
      warehouseReceiptIds: warehouseReceiptId ? [warehouseReceiptId] : [],
      cargoDescription: '2 Pallets Dry Groceries & Beverages',
      totalPackages: 2,
      totalPieces: 48,
      packageType: 'Pallets',
      weightLbs: 2400,
      totalCft: 180,
      freightPayment: 'Prepaid',
    };
    const res = await fetch(`${BASE_URL}/house-bills`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(hblPayload),
    });
    const data = await res.json();
    if (res.status === 201 && data.success) {
      houseBillId = data.data.id;
      console.log(`  ✅ House B/L PASS: Created "${data.data.hblNumber}" (ID: ${houseBillId})`);
      results.push({ step: 'Create House B/L', status: 'PASS', id: houseBillId });
    } else {
      console.error('  ❌ House B/L FAIL:', data);
      results.push({ step: 'Create House B/L', status: 'FAIL', error: data });
    }
  } catch (e) {
    console.error('  ❌ House B/L ERROR:', e.message);
    results.push({ step: 'Create House B/L', status: 'FAIL', error: e.message });
  }

  // 6. Create Consolidation
  console.log('\n--- 6. Creating Consolidation ---');
  try {
    const consPayload = {
      title: 'Miami to St. Thomas Weekly Consolidation CNS-STT-01',
      destinationPort: 'Port of Charlotte Amalie (VISTT)',
      destinationCode: 'STT',
      loadingPort: 'Port of Miami (USMIA)',
      dischargePort: 'Port of Charlotte Amalie (VISTT)',
      containerNumber: 'TGHU-948210-4',
      containerType: '40ft High Cube Standard',
      sealNumber: 'SL-884920',
      vesselId: vesselId || undefined,
      vesselName: 'Atlantic Pioneer',
      carrier: 'Tropical Shipping',
      houseBillIds: houseBillId ? [houseBillId] : [],
      totalHouseBills: houseBillId ? 1 : 0,
      receiptIds: warehouseReceiptId ? [warehouseReceiptId] : [],
      totalReceipts: warehouseReceiptId ? 1 : 0,
      totalPackages: 2,
      totalPieces: 48,
      totalWeightLbs: 2400,
      totalCft: 180,
      status: 'Planning',
    };
    const res = await fetch(`${BASE_URL}/consolidations`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(consPayload),
    });
    const data = await res.json();
    if (res.status === 201 && data.success) {
      consolidationId = data.data.id;
      console.log(`  ✅ Consolidation PASS: Created "${data.data.consolidationNumber}" (ID: ${consolidationId})`);
      results.push({ step: 'Create Consolidation', status: 'PASS', id: consolidationId });
    } else {
      console.error('  ❌ Consolidation FAIL:', data);
      results.push({ step: 'Create Consolidation', status: 'FAIL', error: data });
    }
  } catch (e) {
    console.error('  ❌ Consolidation ERROR:', e.message);
    results.push({ step: 'Create Consolidation', status: 'FAIL', error: e.message });
  }

  // 7. Create Master B/L
  console.log('\n--- 7. Creating Master Ocean B/L ---');
  try {
    const mblPayload = {
      consolidationId: consolidationId || undefined,
      houseBillIds: houseBillId ? [houseBillId] : [],
      shipper: { name: 'KERS Global Freight Forwarding Inc.', address: '8200 NW 33rd Street, Miami, FL 33122 USA' },
      consignee: { name: 'Island Supermarket Ltd', address: 'Veterans Drive, Charlotte Amalie, St. Thomas' },
      oceanVessel: 'Atlantic Pioneer',
      carrier: 'Tropical Shipping',
      portOfLoading: 'Port of Miami, USA (USMIA)',
      portOfDischarge: 'Port of Charlotte Amalie (VISTT)',
      containerNumber: 'TGHU-948210-4',
      sealNumber: 'SL-884920',
      containerType: "40' High Cube",
      packageCount: 2,
      totalPieces: 48,
      packageType: 'Pallets',
      grossWeightLbs: 2400,
      cft: 180,
      cargoDescription: '2 Pallets Groceries & Beverages',
      status: 'Draft',
    };
    const res = await fetch(`${BASE_URL}/bills-of-lading`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(mblPayload),
    });
    const data = await res.json();
    if (res.status === 201 && data.success) {
      masterBlId = data.data.id;
      console.log(`  ✅ Master B/L PASS: Created "${data.data.blNumber}" (ID: ${masterBlId})`);
      results.push({ step: 'Create Master B/L', status: 'PASS', id: masterBlId });
    } else {
      console.error('  ❌ Master B/L FAIL:', data);
      results.push({ step: 'Create Master B/L', status: 'FAIL', error: data });
    }
  } catch (e) {
    console.error('  ❌ Master B/L ERROR:', e.message);
    results.push({ step: 'Create Master B/L', status: 'FAIL', error: e.message });
  }

  // 8. Generate Manifest
  console.log('\n--- 8. Generating Ocean Cargo Manifest ---');
  try {
    const manifestPayload = {
      title: 'Ocean Cargo Inward/Outward Manifest - Voyage STT-01',
      vesselName: 'Atlantic Pioneer',
      carrier: 'Tropical Shipping',
      portOfLoading: 'Port of Miami, USA (USMIA)',
      portOfDischarge: 'Port of Charlotte Amalie (VISTT)',
      masterBLId: masterBlId || undefined,
      totalBLs: 1,
      totalHouseBills: 1,
      totalContainers: 1,
      totalPackages: 2,
      totalPieces: 48,
      totalWeightLbs: 2400,
      totalCft: 180,
      status: 'Generated',
      lineItems: [
        {
          itemNumber: 1,
          hblNumber: 'HBL-STT-001',
          blNumber: 'MBL-STT-001',
          shipper: 'Miami Food Distributors Inc.',
          consignee: 'Island Supermarket Ltd',
          destinationPort: 'Port of Charlotte Amalie (VISTT)',
          containerNumber: 'TGHU-948210-4',
          sealNumber: 'SL-884920',
          packageCount: 2,
          totalPieces: 48,
          packageType: 'Pallet',
          cargoDescription: 'Dry Groceries & Beverages',
          grossWeightLbs: 2400,
          grossWeightKg: 1088.6,
          cft: 180,
          cbm: 5.1,
        },
      ],
    };
    const res = await fetch(`${BASE_URL}/manifests`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(manifestPayload),
    });
    const data = await res.json();
    if (res.status === 201 && data.success) {
      manifestId = data.data.id;
      console.log(`  ✅ Manifest PASS: Created "${data.data.manifestNumber}" (ID: ${manifestId})`);
      results.push({ step: 'Generate Ocean Manifest', status: 'PASS', id: manifestId });
    } else {
      console.error('  ❌ Manifest FAIL:', data);
      results.push({ step: 'Generate Ocean Manifest', status: 'FAIL', error: data });
    }
  } catch (e) {
    console.error('  ❌ Manifest ERROR:', e.message);
    results.push({ step: 'Generate Ocean Manifest', status: 'FAIL', error: e.message });
  }

  // Summary
  console.log('\n=============================================');
  console.log('🏁 Verification Summary:');
  for (const r of results) {
    console.log(`  [${r.status}] ${r.step}`);
  }
  const allPassed = results.every(r => r.status === 'PASS');
  console.log(`\nOverall Result: ${allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'}`);
  console.log('=============================================');
}

runVerification();
