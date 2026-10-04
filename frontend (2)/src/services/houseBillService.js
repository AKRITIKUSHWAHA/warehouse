import { getStored, setStored, KEYS } from './storageService';
import { auditService } from './auditService';
import { apiClient } from './apiClient';

export const houseBillService = {
  async getHouseBills(filters = {}) {
    try {
      const res = await apiClient.get('/house-bills', { params: { ...filters, limit: filters.limit || 100 } });
      const apiData = res?.data ? (Array.isArray(res.data) ? res.data : (res.data.items || [])) : (Array.isArray(res) ? res : []);
      if (Array.isArray(apiData) && apiData.length > 0) {
        const mapped = apiData.map(item => ({
          ...item,
          customerName: item.customerName || (typeof item.consignee === 'object' ? item.consignee.name : item.consignee) || '',
          totalCft: item.totalCft !== undefined ? Number(item.totalCft) : 0,
          totalCbm: item.totalCbm !== undefined ? Number(item.totalCbm) : 0,
          totalWeightLbs: item.totalWeightLbs !== undefined ? Number(item.totalWeightLbs) : 0,
          warehouseReceiptIds: Array.isArray(item.warehouseReceiptIds) ? item.warehouseReceiptIds : [],
        }));
        setStored(KEYS.HOUSE_BILLS, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('API error fetching house bills, fallback to local:', err);
    }

    const list = getStored(KEYS.HOUSE_BILLS, []);
    let filtered = [...list];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.hblNumber?.toLowerCase().includes(q) ||
        item.customerName?.toLowerCase().includes(q) ||
        item.consignee?.name?.toLowerCase().includes(q) ||
        item.shipper?.name?.toLowerCase().includes(q) ||
        item.destinationPort?.toLowerCase().includes(q) ||
        item.cargoDescription?.toLowerCase().includes(q) ||
        item.warehouseReceiptIds?.some(wrId => String(wrId).toLowerCase().includes(q))
      );
    }
    if (filters.status && filters.status !== 'All') {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    if (filters.destination && filters.destination !== 'All') {
      filtered = filtered.filter(item => item.destinationCode === filters.destination);
    }
    if (filters.customerId && filters.customerId !== 'All') {
      filtered = filtered.filter(item => item.customerId === filters.customerId);
    }

    return filtered;
  },

  async getHouseBillById(id) {
    try {
      const res = await apiClient.get(`/house-bills/${id}`);
      const item = res?.data || (res?.id ? res : null);
      if (item) {
        return {
          ...item,
          customerName: item.customerName || (typeof item.consignee === 'object' ? item.consignee.name : item.consignee) || '',
          totalCft: item.totalCft !== undefined ? Number(item.totalCft) : 0,
          totalCbm: item.totalCbm !== undefined ? Number(item.totalCbm) : 0,
          totalWeightLbs: item.totalWeightLbs !== undefined ? Number(item.totalWeightLbs) : 0,
          warehouseReceiptIds: Array.isArray(item.warehouseReceiptIds) ? item.warehouseReceiptIds : [],
        };
      }
    } catch (err) {
      console.warn('API error fetching house bill by id:', err);
    }

    const list = getStored(KEYS.HOUSE_BILLS, []);
    return list.find(item => item.id === id || item.hblNumber === id) || null;
  },

  async createHouseBill(data, currentUser = "Documentation Staff") {
    try {
      const payload = {
        hblNumber: data.hblNumber || undefined,
        customerId: data.customerId || undefined,
        customerName: data.customerName || data.customer || 'Valued Customer',
        shipper: typeof data.shipper === 'object' ? data.shipper : { name: data.shipper || data.customerName || 'General Shipper', address: 'Miami, FL' },
        consignee: typeof data.consignee === 'object' ? data.consignee : { name: data.consignee || 'Consignee', address: data.destinationPort || 'Nassau, Bahamas' },
        notifyParty: data.notifyParty ? (typeof data.notifyParty === 'object' ? data.notifyParty : { name: data.notifyParty, address: 'Destination Port' }) : undefined,
        agentId: data.agentId || undefined,
        agentName: data.agentName || undefined,
        originPort: data.originPort || 'Port of Miami (USMIA), FL',
        destinationPort: data.destinationPort || 'Port of Nassau (BSNAS)',
        destinationCode: data.destinationCode || 'NAS',
        warehouseReceiptIds: data.warehouseReceiptIds || [],
        cargoDescription: data.cargoDescription || 'General Cargo',
        packages: data.packages || [],
        totalPackages: Number(data.totalPackages) || 0,
        totalPieces: Number(data.totalPieces) || 0,
        totalWeightLbs: Number(data.totalWeightLbs) || 0,
        totalWeightKg: Number(data.totalWeightKg) || 0,
        totalCft: Number(data.totalCft) || 0,
        totalCbm: Number(data.totalCbm) || 0,
        freightTerms: data.freightTerms || 'Freight Prepaid',
        status: data.status || 'Active',
        notes: data.notes || '',
      };
      const res = await apiClient.post('/house-bills', payload);
      const createdItem = res?.data || (res?.id ? res : null);
      if (createdItem) {
        const fullItem = {
          ...data,
          ...createdItem,
          customerName: createdItem.customerName || data.customerName,
          freightCharges: data.freightCharges,
          warehouseReceiptIds: createdItem.warehouseReceiptIds || data.warehouseReceiptIds || [],
        };
        const list = getStored(KEYS.HOUSE_BILLS, []);
        const filtered = list.filter(item => item.id !== fullItem.id && item.hblNumber !== fullItem.hblNumber);
        setStored(KEYS.HOUSE_BILLS, [fullItem, ...filtered]);

        // Link assignedHouseBillId on local WRs too
        const wrList = getStored(KEYS.WAREHOUSE_RECEIPTS, []);
        const linkedWrIds = data.warehouseReceiptIds || [];
        if (linkedWrIds.length > 0) {
          const updatedWrs = wrList.map(wr => {
            if (linkedWrIds.includes(wr.id) || linkedWrIds.includes(wr.receiptNumber)) {
              return { ...wr, assignedHouseBillId: fullItem.hblNumber };
            }
            return wr;
          });
          setStored(KEYS.WAREHOUSE_RECEIPTS, updatedWrs);
        }

        await auditService.logAction(
          currentUser,
          "House Bill of Lading",
          "Created House Bill of Lading",
          fullItem.hblNumber || fullItem.id,
          `Issued House B/L ${fullItem.hblNumber} for ${fullItem.customerName} linking ${linkedWrIds.length} WR(s).`
        );

        return fullItem;
      }
    } catch (err) {
      console.warn('API error creating house bill:', err);
      throw err;
    }

    const list = getStored(KEYS.HOUSE_BILLS, []);
    const nextSeq = list.length + 1;
    const id = data.hblNumber || `HBL-2026-${String(nextSeq).padStart(4, '0')}`;


    // Read linked WRs if any to ensure package items and totals are complete
    const wrList = getStored(KEYS.WAREHOUSE_RECEIPTS);
    const linkedWrIds = data.warehouseReceiptIds || [];
    const linkedWrs = wrList.filter(wr => linkedWrIds.includes(wr.id) || linkedWrIds.includes(wr.receiptNumber));

    // Aggregate packages and totals from linked WRs if packages array is empty
    let packages = data.packages || [];
    let totalPieces = data.totalPieces || 0;
    let totalWeightLbs = data.totalWeightLbs || 0;
    let totalCft = data.totalCft || 0;
    let totalCbm = data.totalCbm || 0;

    if (packages.length === 0 && linkedWrs.length > 0) {
      linkedWrs.forEach(wr => {
        if (wr.packages && wr.packages.length > 0) {
          packages = [...packages, ...wr.packages];
        } else {
          packages.push({
            id: `PKG-${wr.receiptNumber}-01`,
            packageType: wr.packageType || "Carton",
            description: wr.cargoDescription || "General Cargo",
            lengthInches: wr.lengthInches || 0,
            widthInches: wr.widthInches || 0,
            heightInches: wr.heightInches || 0,
            weightLbs: wr.weightLbs || 0,
            pieces: wr.totalPieces || wr.packageCount || 1,
            cft: wr.cft || 0,
            cbm: wr.cbm || 0
          });
        }
        totalPieces += Number(wr.totalPieces || wr.packageCount || 0);
        totalWeightLbs += Number(wr.weightLbs || 0);
        totalCft += Number(wr.cft || 0);
        totalCbm += Number(wr.cbm || 0);
      });
    }

    if (totalPieces === 0 && packages.length > 0) {
      packages.forEach(p => {
        totalPieces += Number(p.pieces || 1);
        totalWeightLbs += Number(p.weightLbs || 0);
        totalCft += Number(p.cft || 0);
        totalCbm += Number(p.cbm || 0);
      });
    }

    const totalPackages = packages.length || (data.totalPackages || 1);
    const totalWeightKg = Number((totalWeightLbs * 0.453592).toFixed(1));
    totalCft = Number(totalCft.toFixed(2));
    totalCbm = Number(totalCbm.toFixed(2));

    const newHouseBill = {
      ...data,
      id,
      hblNumber: id,
      customerId: data.customerId || (linkedWrs[0]?.customerId || null),
      customerName: data.customerName || data.customer || (linkedWrs[0]?.customer || "Valued Customer"),
      shipper: data.shipper || {
        name: linkedWrs[0]?.shipper || "Global Freight Supplier",
        address: "Miami CFS Logistics Hub, FL"
      },
      consignee: data.consignee || {
        name: data.customerName || linkedWrs[0]?.customer || "Consignee",
        address: linkedWrs[0]?.consignee || "Destination Port Area"
      },
      notifyParty: data.notifyParty || {
        name: linkedWrs[0]?.agentName || "Caribbean Express Freight Ltd.",
        address: "Destination Port Cargo Terminal"
      },
      agentId: data.agentId || (linkedWrs[0]?.agentId || "AGT-001"),
      agentName: data.agentName || (linkedWrs[0]?.agentName || "Caribbean Express Freight Ltd."),
      originPort: data.originPort || "Port of Miami (USMIA), FL",
      destinationPort: data.destinationPort || (linkedWrs[0]?.destinationPort || "NAS - Nassau, Bahamas"),
      destinationCode: data.destinationCode || (linkedWrs[0]?.destinationCode || "NAS"),
      warehouseReceiptIds: linkedWrIds,
      cargoDescription: data.cargoDescription || linkedWrs.map(w => w.cargoDescription).filter(Boolean).join('; ') || "Consolidated Freight",
      packages,
      totalPackages,
      totalPieces,
      totalWeightLbs,
      totalWeightKg,
      totalCft,
      totalCbm,
      status: data.status || "Active",
      freightTerms: data.freightTerms || "Freight Prepaid",
      createdDate: data.createdDate || new Date().toISOString().split('T')[0],
      issueDate: data.issueDate || new Date().toISOString().split('T')[0],
      assignedConsolidationId: null,
      assignedMasterBLId: null,
      assignedShipmentId: null,
      notes: data.notes || `Created from ${linkedWrIds.length} linked Warehouse Receipt(s).`
    };

    const updated = [newHouseBill, ...list];
    setStored(KEYS.HOUSE_BILLS, updated);

    // Update linked Warehouse Receipts to record assignedHouseBillId
    if (linkedWrIds.length > 0) {
      const updatedWrs = wrList.map(wr => {
        if (linkedWrIds.includes(wr.id) || linkedWrIds.includes(wr.receiptNumber)) {
          return {
            ...wr,
            assignedHouseBillId: id
          };
        }
        return wr;
      });
      setStored(KEYS.WAREHOUSE_RECEIPTS, updatedWrs);
    }

    await auditService.logAction(
      currentUser,
      "House Bill of Lading",
      "Created House Bill of Lading",
      id,
      `Issued House B/L ${id} for ${newHouseBill.customerName} linking ${linkedWrIds.length} WR(s) (${totalPieces} pieces, ${totalCbm} CBM).`
    );

    return newHouseBill;
  },

  async updateHouseBill(id, updates, currentUser = "Documentation Staff") {
    let apiUpdated = null;
    try {
      const res = await apiClient.patch(`/house-bills/${id}`, updates);
      if (res?.data) apiUpdated = res.data;
    } catch (err) {
      console.warn('API error updating house bill:', err);
      throw err;
    }

    const list = getStored(KEYS.HOUSE_BILLS, []);
    const index = list.findIndex(item => item.id === id || item.hblNumber === id);
    if (index !== -1) {
      const merged = {
        ...list[index],
        ...(apiUpdated || {}),
        ...updates,
        freightCharges: updates.freightCharges || list[index].freightCharges,
        shipper: updates.shipper || apiUpdated?.shipper || list[index].shipper,
        consignee: updates.consignee || apiUpdated?.consignee || list[index].consignee,
      };
      list[index] = merged;
      setStored(KEYS.HOUSE_BILLS, list);

      await auditService.logAction(
        currentUser,
        "House Bill of Lading",
        "Updated House Bill of Lading",
        id,
        `Updated details for House B/L ${id}.`
      );

      return merged;
    }
    return apiUpdated;
  },

  async deleteHouseBill(id, currentUser = "Documentation Staff") {
    try {
      await apiClient.delete(`/house-bills/${id}`);
    } catch (err) {
      console.warn('API error deleting house bill:', err);
      throw err;
    }

    const list = getStored(KEYS.HOUSE_BILLS, []);
    const existing = list.find(item => item.id === id || item.hblNumber === id);
    if (!existing) return false;

    const filtered = list.filter(item => item.id !== id && item.hblNumber !== id);
    setStored(KEYS.HOUSE_BILLS, filtered);

    // Unlink assignedHouseBillId from linked WRs
    const wrList = getStored(KEYS.WAREHOUSE_RECEIPTS, []);
    const updatedWrs = wrList.map(wr => {
      if (wr.assignedHouseBillId === id || wr.assignedHouseBillId === existing.hblNumber) {
        return {
          ...wr,
          assignedHouseBillId: null
        };
      }
      return wr;
    });
    setStored(KEYS.WAREHOUSE_RECEIPTS, updatedWrs);

    await auditService.logAction(
      currentUser,
      "House Bill of Lading",
      "Deleted House Bill of Lading",
      id,
      `Deleted House B/L ${id} (${existing.customerName}).`
    );

    return true;
  },

  async placeHold(hblId, reason, notes, currentUser = "Documentation Staff") {
    let apiUpdated = null;
    try {
      const res = await apiClient.post(`/house-bills/${hblId}/hold`, { reason, holdNotes: notes });
      if (res?.data) apiUpdated = res.data;
    } catch (err) {
      console.warn('API error placing house bill on hold:', err);
    }

    const list = getStored(KEYS.HOUSE_BILLS, []);
    const index = list.findIndex(item => item.id === hblId || item.hblNumber === hblId);
    if (index === -1) return null;

    const currentHBL = list[index];
    const updatedHBL = {
      ...currentHBL,
      ...(apiUpdated || {}),
      status: "On Hold",
      holdDetails: {
        isOnHold: true,
        reason: reason || "Documentation Hold",
        placedBy: typeof currentUser === 'string' ? currentUser : currentUser?.name || "Staff",
        placedAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        holdNotes: notes || "Consignment held pending clearance."
      }
    };

    list[index] = updatedHBL;
    setStored(KEYS.HOUSE_BILLS, list);

    await auditService.logAction(
      currentUser,
      "House Bill of Lading",
      "Placed House B/L On Hold",
      hblId,
      `Placed House B/L ${hblId} on hold. Reason: ${reason}`
    );

    return updatedHBL;
  },

  async clearHold(hblId, currentUser = "Super Admin", clearNotes = "") {
    let apiUpdated = null;
    try {
      const res = await apiClient.post(`/house-bills/${hblId}/release`, {});
      if (res?.data) apiUpdated = res.data;
    } catch (err) {
      console.warn('API error clearing house bill hold:', err);
    }

    const list = getStored(KEYS.HOUSE_BILLS, []);
    const index = list.findIndex(item => item.id === hblId || item.hblNumber === hblId);
    if (index === -1) return null;

    const currentHBL = list[index];
    const updatedHBL = {
      ...currentHBL,
      ...(apiUpdated || {}),
      status: "Active",
      holdDetails: {
        isOnHold: false,
        reason: null,
        releasedBy: typeof currentUser === 'string' ? currentUser : currentUser?.name || "Authorized Staff",
        releasedAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        clearNotes: clearNotes || "Hold cleared."
      }
    };

    list[index] = updatedHBL;
    setStored(KEYS.HOUSE_BILLS, list);

    await auditService.logAction(
      currentUser,
      "House Bill of Lading",
      "Cleared Hold on House B/L",
      hblId,
      `Cleared hold on House B/L ${hblId}. Status is now Active.`
    );

    return updatedHBL;
  },


  async updateStatus(hblId, newStatus, currentUser = "Documentation Staff") {
    const list = getStored(KEYS.HOUSE_BILLS);
    const index = list.findIndex(item => item.id === hblId || item.hblNumber === hblId);
    if (index === -1) return null;

    list[index].status = newStatus;
    setStored(KEYS.HOUSE_BILLS, list);

    await auditService.logAction(
      currentUser,
      "House Bill of Lading",
      `Updated House B/L Status to ${newStatus}`,
      hblId,
      `House B/L ${hblId} status changed to ${newStatus}.`
    );

    return list[index];
  }
};
