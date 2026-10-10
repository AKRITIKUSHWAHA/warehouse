import { getStored, setStored, KEYS } from './storageService';
import { auditService } from './auditService';
import { apiClient } from './apiClient';
import { apiFetch } from './apiConfig';

export const consolidationService = {
  async getConsolidations(filters = {}) {
    try {
      const res = await apiClient.get('/consolidations', { params: { ...filters, limit: filters.limit || 100 } });
      const apiData = res?.data ? (Array.isArray(res.data) ? res.data : (res.data.items || [])) : (Array.isArray(res) ? res : []);
      if (Array.isArray(apiData) && apiData.length > 0) {
        const mapped = apiData.map(item => ({
          ...item,
          totalCft: item.totalCft !== undefined ? Number(item.totalCft) : 0,
          totalCbm: item.totalCbm !== undefined ? Number(item.totalCbm) : 0,
          totalWeightLbs: item.totalWeightLbs !== undefined ? Number(item.totalWeightLbs) : 0,
          totalPackages: item.totalPackages !== undefined ? Number(item.totalPackages) : 0,
          totalReceipts: item.totalReceipts !== undefined ? Number(item.totalReceipts) : (item.receiptIds?.length || 0),
          containerFillPercentage: item.containerFillPercentage !== undefined ? Number(item.containerFillPercentage) : 0,
          receiptIds: Array.isArray(item.receiptIds) ? item.receiptIds : [],
          houseBillIds: Array.isArray(item.houseBillIds) ? item.houseBillIds : [],
        }));
        setStored(KEYS.CONSOLIDATIONS, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Backend API /consolidations fetch failed, using local store:', err?.message || err);
    }

    const list = getStored(KEYS.CONSOLIDATIONS, []);
    let filtered = [...list];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.consolidationNumber?.toLowerCase().includes(q) ||
        item.title?.toLowerCase().includes(q) ||
        item.destinationPort?.toLowerCase().includes(q) ||
        item.containerNumber?.toLowerCase().includes(q) ||
        item.vesselName?.toLowerCase().includes(q) ||
        item.houseBillIds?.some(hId => String(hId).toLowerCase().includes(q))
      );
    }
    if (filters.status && filters.status !== 'All') {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    if (filters.destination && filters.destination !== 'All') {
      filtered = filtered.filter(item => item.destinationCode === filters.destination);
    }

    return filtered;
  },

  async getConsolidationById(id) {
    if (!id) return null;
    try {
      const res = await apiClient.get(`/consolidations/${encodeURIComponent(id)}`);
      const item = res?.data || (res?.id ? res : null);
      if (item) {
        return {
          ...item,
          totalCft: item.totalCft !== undefined ? Number(item.totalCft) : 0,
          totalCbm: item.totalCbm !== undefined ? Number(item.totalCbm) : 0,
          totalWeightLbs: item.totalWeightLbs !== undefined ? Number(item.totalWeightLbs) : 0,
          totalPackages: item.totalPackages !== undefined ? Number(item.totalPackages) : 0,
          totalReceipts: item.totalReceipts !== undefined ? Number(item.totalReceipts) : (item.receiptIds?.length || 0),
          containerFillPercentage: item.containerFillPercentage !== undefined ? Number(item.containerFillPercentage) : 0,
          receiptIds: Array.isArray(item.receiptIds) ? item.receiptIds : [],
          houseBillIds: Array.isArray(item.houseBillIds) ? item.houseBillIds : [],
        };
      }
    } catch (err) {
      console.warn(`API error fetching consolidation by id ${id}:`, err?.message || err);
    }

    const list = getStored(KEYS.CONSOLIDATIONS, []);
    return list.find(item => item.id === id || item.consolidationNumber === id) || null;
  },

  async createConsolidation(consolidationData, currentUser = "Operations Staff") {
    let createdConsolidationFromApi = null;
    try {
      const payload = {
        title: consolidationData.title || `Consolidation - ${consolidationData.destinationPort || 'NAS'}`,
        destinationPort: consolidationData.destinationPort || 'Port of Nassau (BSNAS)',
        destinationCode: consolidationData.destinationCode || 'NAS',
        status: consolidationData.status || 'Loaded',
        containerId: consolidationData.containerId || undefined,
        containerNumber: consolidationData.containerNumber || 'MSKU-948291-4',
        containerType: consolidationData.containerType || "40' High Cube",
        containerCapacityCbm: Number(consolidationData.containerCapacityCbm) || 67.7,
        sealNumber: consolidationData.sealNumber || 'SEAL-01',
        vesselId: consolidationData.vesselId || undefined,
        vesselName: consolidationData.vesselName || 'MV Caribbean Carrier',
        voyageId: consolidationData.voyageId || undefined,
        voyageNumber: consolidationData.voyageNumber || 'V.2026-20W',
        carrier: consolidationData.carrier || 'Tropical Shipping Line',
        loadingPort: consolidationData.loadingPort || 'Port of Miami (USMIA)',
        dischargePort: consolidationData.dischargePort || consolidationData.destinationPort || 'Port of Nassau (BSNAS)',
        houseBillIds: consolidationData.houseBillIds || [],
        receiptIds: consolidationData.receiptIds || [],
        totalHouseBills: Number(consolidationData.totalHouseBills) || (consolidationData.houseBillIds?.length || 0),
        totalReceipts: Number(consolidationData.totalReceipts) || (consolidationData.receiptIds?.length || 0),
        totalPackages: Number(consolidationData.totalPackages) || 0,
        totalPieces: Number(consolidationData.totalPieces) || 0,
        totalWeightLbs: Number(consolidationData.totalWeightLbs) || 0,
        totalWeightKg: Number(consolidationData.totalWeightKg) || 0,
        totalCft: Number(consolidationData.totalCft) || 0,
        totalCbm: Number(consolidationData.totalCbm) || 0,
        containerFillPercentage: Number(consolidationData.containerFillPercentage) || 0,
        agentId: consolidationData.agentId || undefined,
        agentName: consolidationData.agentName || 'Caribbean Express Freight Ltd.',
        etd: consolidationData.etd || new Date().toISOString().split('T')[0],
        eta: consolidationData.eta || '2026-09-06',
        notes: consolidationData.notes || '',
      };
      const res = await apiClient.post('/consolidations', payload);
      if (res?.data) {
        createdConsolidationFromApi = res.data;
      }
    } catch (err) {
      console.warn('API error creating consolidation cascade:', err);
      throw err;
    }

    const list = getStored(KEYS.CONSOLIDATIONS, []);
    const id = createdConsolidationFromApi?.consolidationNumber || consolidationData.consolidationNumber;
    const shipmentId = createdConsolidationFromApi?.assignedShipmentId || `SHP-2026-${291 + list.length + 1}`;
    const blId = createdConsolidationFromApi?.assignedMasterBLId || `BL-VI-2026-${String(95 + list.length + 1).padStart(4, '0')}`;
    const manifestId = `MNF-2026-${443 + list.length}`;

    // 1. Resolve selected House Bills
    const houseBillList = getStored(KEYS.HOUSE_BILLS);
    const selectedHblIds = consolidationData.houseBillIds || [];
    const selectedHbls = houseBillList.filter(h => selectedHblIds.includes(h.id) || selectedHblIds.includes(h.hblNumber));

    // 2. Gather all associated WR IDs from HBLs (or direct receiptIds if any)
    let allReceiptIds = [...(consolidationData.receiptIds || [])];
    selectedHbls.forEach(h => {
      if (h.warehouseReceiptIds && h.warehouseReceiptIds.length > 0) {
        h.warehouseReceiptIds.forEach(rId => {
          if (!allReceiptIds.includes(rId)) allReceiptIds.push(rId);
        });
      }
    });

    // 3. Aggregate totals if not provided
    let totalPieces = Number(consolidationData.totalPieces) || 0;
    let totalPackages = Number(consolidationData.totalPackages) || 0;
    let totalWeightLbs = Number(consolidationData.totalWeightLbs) || 0;
    let totalCft = Number(consolidationData.totalCft) || 0;
    let totalCbm = Number(consolidationData.totalCbm) || 0;

    if (totalPieces === 0 && selectedHbls.length > 0) {
      selectedHbls.forEach(h => {
        totalPieces += Number(h.totalPieces || 0);
        totalPackages += Number(h.totalPackages || 1);
        totalWeightLbs += Number(h.totalWeightLbs || 0);
        totalCft += Number(h.totalCft || 0);
        totalCbm += Number(h.totalCbm || 0);
      });
    }

    const totalWeightKg = Number((totalWeightLbs * 0.453592).toFixed(1));
    totalCft = Number(totalCft.toFixed(2));
    totalCbm = Number(totalCbm.toFixed(2));

    const createdConsolidation = createdConsolidationFromApi || {
      ...consolidationData,
      id,
      consolidationNumber: id,
      title: consolidationData.title || `Consolidation ${id} - ${consolidationData.destinationPort || 'NAS'}`,
      destinationPort: consolidationData.destinationPort || 'NAS - Nassau, Bahamas',
      destinationCode: consolidationData.destinationCode || (consolidationData.destinationPort?.includes(' - ') ? consolidationData.destinationPort.split(' - ')[0].trim() : 'NAS'),
      createdDate: new Date().toISOString().split('T')[0],
      status: consolidationData.status || "Loaded",
      totalHouseBills: selectedHbls.length || selectedHblIds.length,
      houseBillIds: selectedHblIds,
      totalReceipts: allReceiptIds.length,
      receiptIds: allReceiptIds,
      totalPackages,
      totalPieces,
      totalWeightLbs,
      totalWeightKg,
      totalCft,
      totalCbm,
      containerFillPercentage,
      assignedShipmentId: shipmentId,
      assignedMasterBLId: blId,
      assignedManifestId: manifestId
    };

    const updatedConsolidations = [createdConsolidation, ...list.filter(c => c.id !== createdConsolidation.id && c.consolidationNumber !== createdConsolidation.consolidationNumber)];
    setStored(KEYS.CONSOLIDATIONS, updatedConsolidations);

    // 4. Update linked House Bills in storage
    const updatedHouseBills = houseBillList.map(hbl => {
      if (selectedHblIds.includes(hbl.id) || selectedHblIds.includes(hbl.hblNumber)) {
        return {
          ...hbl,
          status: "Consolidated",
          assignedConsolidationId: id,
          assignedMasterBLId: blId,
          assignedShipmentId: shipmentId
        };
      }
      return hbl;
    });
    setStored(KEYS.HOUSE_BILLS, updatedHouseBills);

    // 5. Update linked Warehouse Receipts to 'Consolidated'
    const wrList = getStored(KEYS.WAREHOUSE_RECEIPTS);
    const updatedWrList = wrList.map(wr => {
      if (allReceiptIds.includes(wr.id) || allReceiptIds.includes(wr.receiptNumber)) {
        return {
          ...wr,
          status: "Consolidated",
          assignedConsolidationId: id,
          assignedShipmentId: shipmentId
        };
      }
      return wr;
    });
    setStored(KEYS.WAREHOUSE_RECEIPTS, updatedWrList);

    // 6. Update matching Cargo Inventory items to 'Consolidated'
    const cargoList = getStored(KEYS.CARGO);
    const updatedCargoList = cargoList.map(cargo => {
      if (allReceiptIds.includes(cargo.warehouseReceiptId) || allReceiptIds.includes(cargo.receiptNumber)) {
        return {
          ...cargo,
          status: "Consolidated",
          assignedConsolidationId: id,
          assignedShipmentId: shipmentId
        };
      }
      return cargo;
    });
    setStored(KEYS.CARGO, updatedCargoList);

    // 7. Auto-create Master Shipment
    const shipmentsList = getStored(KEYS.SHIPMENTS);
    const newShipment = {
      id: shipmentId,
      shipmentNumber: shipmentId,
      type: "Ocean LCL Consolidation",
      serviceMode: "Port-to-Port",
      status: "Loaded & Sealed",
      trackingNumber: `TRK-VI-${Math.floor(100000 + Math.random() * 900000)}`,
      origin: consolidationData.loadingPort || "Port of Miami (USMIA)",
      destination: consolidationData.dischargePort || "Port of Nassau (BSNAS)",
      destinationPort: consolidationData.destinationPort || "Nassau, Bahamas",
      destinationCode: consolidationData.destinationCode || "NAS",
      agentId: consolidationData.agentId || "AGT-001",
      agentName: consolidationData.agentName || "Caribbean Express Freight Ltd.",
      vesselName: consolidationData.vesselName || "MV Caribbean Carrier",
      voyageNumber: consolidationData.voyageNumber || "V.2026-20W",
      carrier: consolidationData.carrier || "Tropical Shipping Line",
      containerNumber: consolidationData.containerNumber || "MSKU-948291-4",
      containerType: consolidationData.containerType || "40' High Cube",
      sealNumber: consolidationData.sealNumber || `SEAL-VI-${Math.floor(10000 + Math.random() * 90000)}`,
      billOfLadingId: blId,
      billOfLadingNumber: blId,
      blStatus: "Draft",
      manifestNumber: manifestId,
      consolidationId: id,
      houseBillIds: selectedHblIds,
      warehouseReceiptIds: allReceiptIds,
      totalHouseBills: selectedHbls.length,
      totalPackages,
      totalPieces,
      totalWeightLbs,
      totalWeightKg,
      totalCft,
      totalCbm,
      etd: consolidationData.etd || new Date().toISOString().split('T')[0],
      eta: consolidationData.eta || "2026-09-06",
      createdDate: new Date().toISOString().split('T')[0],
      currentLocation: `${consolidationData.loadingPort || 'Port of Miami'} CFS Yard`,
      trackingCheckpoints: [
        {
          id: `chk-${Date.now()}-1`,
          stage: "Cargo Received",
          status: "Completed",
          date: new Date().toISOString().split('T')[0],
          time: "09:00 AM",
          location: "VI CFS Miami Warehouse",
          notes: "Warehouse receipts received and staged."
        },
        {
          id: `chk-${Date.now()}-2`,
          stage: "House B/L Issued & Grouped",
          status: "Completed",
          date: new Date().toISOString().split('T')[0],
          time: "10:30 AM",
          location: "KERS Documentation Desk",
          notes: `Linked ${selectedHblIds.length} House B/L(s) into consolidation.`
        },
        {
          id: `chk-${Date.now()}-3`,
          stage: "Loaded & Sealed",
          status: "Active",
          date: new Date().toISOString().split('T')[0],
          time: "02:00 PM",
          location: consolidationData.loadingPort || "Port of Miami",
          notes: `Container ${consolidationData.containerNumber} sealed with bolt seal ${consolidationData.sealNumber || 'SEAL-01'}. Draft Master B/L generated.`
        },
        {
          id: `chk-${Date.now()}-4`,
          stage: "In Transit",
          status: "Pending",
          date: consolidationData.etd || "2026-09-01",
          time: "06:00 PM",
          location: "Ocean Crossing",
          notes: "Awaiting ocean vessel departure."
        },
        {
          id: `chk-${Date.now()}-5`,
          stage: "Arrived at Port",
          status: "Pending",
          date: consolidationData.eta || "2026-09-06",
          time: "08:00 AM",
          location: consolidationData.dischargePort || "Destination Port",
          notes: "Expected berthing and customs entry."
        },
        {
          id: `chk-${Date.now()}-6`,
          stage: "Delivered / Released",
          status: "Pending",
          date: "2026-09-07 (Est)",
          time: "02:00 PM",
          location: "Destination CFS Hub",
          notes: "Pending final customs and agent release."
        }
      ]
    };
    setStored(KEYS.SHIPMENTS, [newShipment, ...shipmentsList]);

    // 8. Auto-create Master Ocean Bill of Lading
    const blList = getStored(KEYS.BILLS_OF_LADING);
    const cargoSummaryText = selectedHbls.length > 0
      ? `Consolidated Ocean Freight containing ${selectedHbls.length} House B/L(s) (${allReceiptIds.length} WRs): ` + selectedHbls.map(h => h.cargoDescription).filter(Boolean).join('; ')
      : `Consolidated Ocean Freight: ${consolidationData.title}`;

    const newBL = {
      id: blId,
      blNumber: blId,
      type: "Master Ocean Bill of Lading",
      status: "Draft",
      shipmentId: shipmentId,
      shipmentNumber: shipmentId,
      consolidationId: id,
      houseBillIds: selectedHblIds,
      createdDate: new Date().toISOString().split('T')[0],
      issueDate: new Date().toISOString().split('T')[0],
      shipper: {
        name: "VI Logistics Consolidation Services",
        address: "8400 NW 36th Street, Suite 500, Miami, FL 33166, USA",
        taxId: "EIN-59-9948210",
        contact: "Operations (+1 305-555-5377)"
      },
      consignee: {
        name: consolidationData.agentName || "Caribbean Port Agent Ltd.",
        address: `${consolidationData.destinationPort || 'Port of Discharge'}, Commercial Maritime Hub`,
        taxId: "TIN-LOCAL-DEST",
        contact: "Port Agent Inward Desk"
      },
      notifyParty: {
        name: consolidationData.agentName || "Caribbean Port Agent Ltd.",
        address: `${consolidationData.destinationPort || 'Port of Discharge'}, Cargo Gate`,
        contact: "Duty Officer"
      },
      agentId: consolidationData.agentId || "AGT-001",
      agentName: consolidationData.agentName || "Caribbean Express Freight Ltd.",
      preCarriageBy: "VI Inland Drayage",
      placeOfReceipt: "Miami CFS",
      oceanVessel: consolidationData.vesselName || "MV Caribbean Carrier",
      voyageNumber: consolidationData.voyageNumber || "V.2026-20W",
      carrier: consolidationData.carrier || "Tropical Shipping Line",
      portOfLoading: consolidationData.loadingPort || "Port of Miami (USMIA)",
      portOfDischarge: consolidationData.dischargePort || "Port of Nassau (BSNAS)",
      placeOfDelivery: consolidationData.dischargePort || "Port of Nassau (BSNAS)",
      containerNumber: consolidationData.containerNumber || "MSKU-948291-4",
      sealNumber: consolidationData.sealNumber || "SEAL-VI-99482",
      containerType: consolidationData.containerType || "40' High Cube",
      marksAndNumbers: `CNS/${new Date().getFullYear()}/${id}\nCONTAINER: ${consolidationData.containerNumber}\nSEAL: ${consolidationData.sealNumber}`,
      cargoDescription: cargoSummaryText,
      packageCount: totalPackages,
      totalPieces,
      packageType: "Consolidated Units",
      grossWeightLbs: totalWeightLbs,
      grossWeightKg: totalWeightKg,
      cbm: totalCbm,
      cft: totalCft,
      freightPayableAt: "Miami, FL",
      freightTerms: "Freight Prepaid",
      numberOfOriginals: "3 (THREE)",
      holdDetails: {
        isOnHold: false,
        reason: null
      },
      charges: [
        { description: "Ocean Freight (Consolidated LCL/FCL)", rate: "$55.00 / CBM", amount: Number((55 * (totalCbm || 1)).toFixed(2)), prepaid: true },
        { description: "Documentation & Master B/L Prep", rate: "Flat", amount: 150.00, prepaid: true },
        { description: "Terminal Handling Charges (THC)", rate: "Flat", amount: 280.00, prepaid: true }
      ],
      totalFreightUsd: Number((55 * (totalCbm || 1) + 430).toFixed(2))
    };
    setStored(KEYS.BILLS_OF_LADING, [newBL, ...blList]);

    // 9. Auto-create Customs Manifest with HBL Line Items
    const manifestsList = getStored(KEYS.MANIFESTS);
    const lineItems = selectedHbls.map((hbl, idx) => ({
      itemNumber: idx + 1,
      hblNumber: hbl.hblNumber,
      blNumber: blId,
      shipper: typeof hbl.shipper === 'object' ? hbl.shipper.name : hbl.shipper || "Shipper",
      consignee: typeof hbl.consignee === 'object' ? hbl.consignee.name : hbl.consignee || "Consignee",
      notifyParty: typeof hbl.notifyParty === 'object' ? hbl.notifyParty.name : hbl.notifyParty || consolidationData.agentName,
      destinationPort: hbl.destinationPort || consolidationData.destinationPort,
      containerNumber: consolidationData.containerNumber,
      sealNumber: consolidationData.sealNumber,
      packageCount: hbl.totalPackages || 1,
      totalPieces: hbl.totalPieces || hbl.totalPackages || 1,
      packageType: hbl.packages?.[0]?.packageType || "Cartons / Pallets",
      cargoDescription: hbl.cargoDescription || "General Freight",
      grossWeightKg: hbl.totalWeightKg || Number((hbl.totalWeightLbs * 0.453592).toFixed(1)),
      grossWeightLbs: hbl.totalWeightLbs || 0,
      cbm: hbl.totalCbm || 0,
      cft: hbl.totalCft || 0,
      customsValueUsd: Number((hbl.totalPieces * 1250).toFixed(2)) || 25000.00
    }));

    const newManifest = {
      id: manifestId,
      manifestNumber: manifestId,
      type: "Ocean Cargo Inward / Outward Manifest",
      title: `Master Outward Manifest — Voyage ${consolidationData.voyageNumber || '2026-20W'}`,
      vesselName: consolidationData.vesselName || "MV Caribbean Carrier",
      voyageNumber: consolidationData.voyageNumber || "V.2026-20W",
      flag: "Bahamas",
      masterName: "Capt. Arthur Sterling",
      portOfLoading: consolidationData.loadingPort || "Port of Miami (USMIA)",
      portOfDischarge: consolidationData.dischargePort || "Port of Nassau (BSNAS)",
      departureDate: consolidationData.etd || new Date().toISOString().split('T')[0],
      arrivalDate: consolidationData.eta || "2026-09-06",
      carrier: consolidationData.carrier || "Tropical Shipping Line",
      totalBLs: 1,
      totalHouseBills: selectedHbls.length,
      totalContainers: 1,
      totalPackages,
      totalPieces,
      totalWeightLbs,
      totalWeightKg,
      totalCbm,
      totalCft,
      status: "Generated",
      createdAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      masterBLNumber: blId,
      consolidationId: id,
      lineItems
    };
    setStored(KEYS.MANIFESTS, [newManifest, ...manifestsList]);

    // 10. Audit log
    await auditService.logAction(
      currentUser,
      "Consolidation",
      "Created Consolidated Shipment",
      id,
      `Consolidation ${id} created with ${selectedHblIds.length} House B/L(s) (${allReceiptIds.length} WRs) in container ${consolidationData.containerNumber}. Generated Shipment ${shipmentId}, Master B/L ${blId} & Manifest ${manifestId}.`
    );

    return createdConsolidation;
  },

  async updateConsolidation(id, updates, currentUser = "Operations Staff") {
    let updatedConsolidation = null;
    try {
      const res = await apiClient.patch(`/consolidations/${encodeURIComponent(id)}`, updates);
      if (res && res.data) {
        updatedConsolidation = res.data;
      } else if (res && res.id) {
        updatedConsolidation = res;
      }
    } catch (err) {
      console.warn(`Backend updateConsolidation ${id} failed:`, err?.message || err);
      throw err;
    }

    const list = getStored(KEYS.CONSOLIDATIONS, []);
    const index = list.findIndex(item => item.id === id || item.consolidationNumber === id);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        ...(updatedConsolidation || updates)
      };
      setStored(KEYS.CONSOLIDATIONS, list);

      const refNumber = list[index]?.consolidationNumber || updatedConsolidation?.consolidationNumber || id;
      await auditService.logAction(
        currentUser,
        "Consolidation",
        "Updated Consolidation",
        refNumber,
        `Updated details for Consolidation ${refNumber}.`
      );

      return list[index];
    }
    return updatedConsolidation;
  },

  async deleteConsolidation(id, currentUser = "Operations Staff") {
    try {
      await apiClient.delete(`/consolidations/${encodeURIComponent(id)}`);
    } catch (err) {
      console.warn(`Backend deleteConsolidation ${id} failed:`, err?.message || err);
      throw err;
    }

    const list = getStored(KEYS.CONSOLIDATIONS, []);
    const existing = list.find(item => item.id === id || item.consolidationNumber === id);
    const filtered = list.filter(item => item.id !== id && item.consolidationNumber !== id);
    setStored(KEYS.CONSOLIDATIONS, filtered);

    if (existing) {
      const receiptIds = existing.receiptIds || [];
      const hblIds = existing.houseBillIds || [];
      if (receiptIds.length > 0) {
        const wrs = getStored(KEYS.WAREHOUSE_RECEIPTS, []);
        const updatedWrs = wrs.map(wr => {
          if (receiptIds.includes(wr.receiptNumber || wr.id)) {
            return { ...wr, status: "Ready for Consolidation", assignedConsolidationId: null };
          }
          return wr;
        });
        setStored(KEYS.WAREHOUSE_RECEIPTS, updatedWrs);
      }
      if (hblIds.length > 0) {
        const hbls = getStored(KEYS.HOUSE_BILLS, []);
        const updatedHbls = hbls.map(hb => {
          if (hblIds.includes(hb.hblNumber || hb.id)) {
            return { ...hb, status: "Active", assignedConsolidationId: null };
          }
          return hb;
        });
        setStored(KEYS.HOUSE_BILLS, updatedHbls);
      }
    }

    const refNumber = existing?.consolidationNumber || id;
    await auditService.logAction(
      currentUser,
      "Consolidation",
      "Deleted Consolidation",
      refNumber,
      `Deleted Consolidation ${refNumber} (${existing?.title || 'Consolidation'}).`
    );

    return true;
  }
};
