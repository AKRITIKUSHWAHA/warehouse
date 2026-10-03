import { getStored, setStored, KEYS } from './storageService';
import { auditService } from './auditService';
import { apiClient } from './apiClient';
import { apiFetch } from './apiConfig';

export const warehouseService = {
  async getReceipts(filters = {}) {
    try {
      const res = await apiClient.get('warehouse-receipts', { params: { ...filters, limit: 100 } });
      const apiData = res?.data ? (Array.isArray(res.data) ? res.data : (res.data.items || [])) : (Array.isArray(res) ? res : []);
      if (apiData.length > 0) {
        const localList = getStored(KEYS.WAREHOUSE_RECEIPTS, []);
        const mergedMap = new Map();
        [...localList, ...apiData].forEach(item => {
          const key = item.id || item.receiptNumber;
          if (key) mergedMap.set(key, { ...mergedMap.get(key), ...item });
        });
        const merged = Array.from(mergedMap.values());
        setStored(KEYS.WAREHOUSE_RECEIPTS, merged);
        return merged;
      }
    } catch (err) {
      console.warn('Backend warehouse-receipts fetch note, using cached store:', err?.message || err);
    }

    const list = getStored(KEYS.WAREHOUSE_RECEIPTS, []);
    let filtered = [...list];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.receiptNumber?.toLowerCase().includes(q) ||
        item.customer?.toLowerCase().includes(q) ||
        item.customerName?.toLowerCase().includes(q) ||
        item.consignee?.toLowerCase().includes(q) ||
        item.cargoDescription?.toLowerCase().includes(q) ||
        item.destinationPort?.toLowerCase().includes(q)
      );
    }
    if (filters.status && filters.status !== 'All') {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    if (filters.agentId && filters.agentId !== 'All') {
      filtered = filtered.filter(item => item.agentId === filters.agentId);
    }
    if (filters.destination && filters.destination !== 'All') {
      filtered = filtered.filter(item => item.destinationCode === filters.destination);
    }
    if (filters.customerId && filters.customerId !== 'All') {
      filtered = filtered.filter(item => item.customerId === filters.customerId);
    }

    return filtered;
  },

  async getReceiptById(id) {
    if (!id) return null;
    try {
      const res = await apiClient.get(`warehouse-receipts/${encodeURIComponent(id)}`);
      const apiData = res?.data || res;
      if (apiData && (apiData.id || apiData.receiptNumber)) return apiData;
    } catch (err) {
      console.warn(`Backend API fetch for receipt ${id} failed:`, err?.message || err);
    }

    const list = getStored(KEYS.WAREHOUSE_RECEIPTS, []);
    return list.find(item => item.id === id || item.receiptNumber === id) || null;
  },

  async createReceipt(receiptData, currentUser = "Warehouse Staff") {
    // Process packages array if provided, or build single package default
    let packages = receiptData.packages || [];
    if (packages.length === 0) {
      const l = Number(receiptData.lengthInches) || Number(receiptData.length) || 0;
      const w = Number(receiptData.widthInches) || Number(receiptData.width) || 0;
      const h = Number(receiptData.heightInches) || Number(receiptData.height) || 0;
      const pCount = Number(receiptData.packageCount) || 1;
      const pWeight = Number(receiptData.weightLbs) || 0;
      
      let pCft = 0;
      let pCbm = 0;
      if (l && w && h) {
        pCft = Number(((l * w * h * pCount) / 1728).toFixed(2));
        pCbm = Number((pCft * 0.0283168).toFixed(2));
      }

      packages = [{
        id: `PKG-${receiptData.receiptNumber || '01'}-01`,
        packageType: receiptData.packageType || "Carton",
        description: receiptData.cargoDescription || "General Cargo",
        lengthInches: l,
        widthInches: w,
        heightInches: h,
        weightLbs: pWeight,
        pieces: pCount,
        cft: pCft,
        cbm: pCbm
      }];
    }

    // Calculate aggregated totals from packages
    let totalPieces = 0;
    let totalWeightLbs = 0;
    let totalCft = 0;
    let totalCbm = 0;

    packages.forEach(pkg => {
      totalPieces += Number(pkg.pieces || 1);
      totalWeightLbs += Number(pkg.weightLbs || 0);
      totalCft += Number(pkg.cft || 0);
      totalCbm += Number(pkg.cbm || 0);
    });

    totalCft = Number(totalCft.toFixed(2));
    totalCbm = Number(totalCbm.toFixed(2));
    const totalWeightKg = Number((totalWeightLbs * 0.453592).toFixed(1));

    const destPort = receiptData.destinationPort || "NAS - Nassau Container Port";
    const destCode = receiptData.destinationCode || (destPort.includes(' - ') ? destPort.split(' - ')[0].trim() : 'NAS');

    const payload = {
      ...receiptData,
      receiptNumber: receiptData.receiptNumber,
      date: receiptData.date || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerId: receiptData.customerId || null,
      customer: receiptData.customer || receiptData.customerName || "General Cargo Consignee",
      customerName: receiptData.customerName || receiptData.customer || "General Cargo Consignee",
      destinationPort: destPort,
      destinationCode: destCode,
      status: receiptData.status || "Ready for Consolidation",
      packages,
      packageCount: packages.length,
      totalPieces: totalPieces || 1,
      weightLbs: totalWeightLbs,
      weightKg: totalWeightKg,
      cft: totalCft,
      cbm: totalCbm,
      warehouseLocation: receiptData.warehouseLocation || 'Bay A-1 (CFS Staging)'
    };

    let createdReceipt = null;
    try {
      const res = await apiClient.post('warehouse-receipts', payload);
      if (res) {
        createdReceipt = res.data || res;
      }
    } catch (err) {
      console.warn('Backend createReceipt failed, falling back to local:', err?.message || err);
    }

    if (!createdReceipt) {
      const list = getStored(KEYS.WAREHOUSE_RECEIPTS, []);
      const id = payload.receiptNumber || String(3100 + list.length);
      createdReceipt = {
        ...payload,
        id,
        receiptNumber: id,
        barcode: `WR${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        qrCode: `VI-${id}-${destCode}-${totalPieces}PK`,
        assignedHouseBillId: null,
        assignedConsolidationId: null,
        assignedShipmentId: null
      };
    }

    const list = getStored(KEYS.WAREHOUSE_RECEIPTS, []);
    const updated = [createdReceipt, ...list.filter(r => r.id !== createdReceipt.id && r.receiptNumber !== createdReceipt.receiptNumber)];
    setStored(KEYS.WAREHOUSE_RECEIPTS, updated);

    // Also add to cargo inventory
    const cargoList = getStored(KEYS.CARGO, []);
    const newCargo = {
      id: `CRG-${createdReceipt.receiptNumber || createdReceipt.id}-01`,
      warehouseReceiptId: createdReceipt.id || createdReceipt.receiptNumber,
      receiptNumber: createdReceipt.receiptNumber || createdReceipt.id,
      customer: createdReceipt.customer || createdReceipt.customerName,
      description: createdReceipt.cargoDescription || packages[0]?.description || "General Freight",
      packageCount: createdReceipt.packageCount || 1,
      totalPieces: createdReceipt.totalPieces || totalPieces,
      packageType: packages[0]?.packageType || "Carton",
      weightLbs: totalWeightLbs,
      cft: totalCft,
      cbm: totalCbm,
      warehouseLocation: createdReceipt.warehouseLocation || "Bay A-1 (CFS Staging)",
      destinationPort: createdReceipt.destinationPort,
      destinationCode: createdReceipt.destinationCode,
      status: "Ready for Consolidation",
      barcode: `CRG${Math.floor(10000000 + Math.random() * 90000000)}`,
      qrCode: `VI-CRG-${createdReceipt.receiptNumber || createdReceipt.id}`
    };
    setStored(KEYS.CARGO, [newCargo, ...cargoList.filter(c => c.warehouseReceiptId !== newCargo.warehouseReceiptId)]);

    // Audit log
    await auditService.logAction(
      currentUser,
      "Warehouse Receipt",
      "Created Warehouse Receipt",
      createdReceipt.receiptNumber || createdReceipt.id,
      `Intake completed for ${createdReceipt.customer || createdReceipt.customerName} (${createdReceipt.receiptNumber || createdReceipt.id}): ${packages.length} package type(s), ${totalPieces} total piece(s), ${totalCbm} CBM.`
    );

    return createdReceipt;
  },

  async updateReceipt(id, updates, currentUser = "Warehouse Staff") {
    let updatedReceipt = null;
    try {
      const res = await apiClient.put(`warehouse-receipts/${encodeURIComponent(id)}`, updates);
      if (res) {
        updatedReceipt = res.data || res;
      }
    } catch (err) {
      console.warn(`Backend updateReceipt ${id} failed:`, err?.message || err);
    }

    const list = getStored(KEYS.WAREHOUSE_RECEIPTS, []);
    const index = list.findIndex(item => item.id === id || item.receiptNumber === id);
    if (index !== -1) {
      let packages = updates.packages || list[index].packages || [];
      
      let totalPieces = 0;
      let totalWeightLbs = 0;
      let totalCft = 0;
      let totalCbm = 0;

      if (packages.length > 0) {
        packages.forEach(pkg => {
          totalPieces += Number(pkg.pieces || 1);
          totalWeightLbs += Number(pkg.weightLbs || 0);
          totalCft += Number(pkg.cft || 0);
          totalCbm += Number(pkg.cbm || 0);
        });
      } else {
        totalPieces = Number(updates.totalPieces || updates.packageCount || list[index].totalPieces || 1);
        totalWeightLbs = Number(updates.weightLbs || list[index].weightLbs || 0);
        totalCft = Number(updates.cft || list[index].cft || 0);
        totalCbm = Number(updates.cbm || list[index].cbm || 0);
      }

      totalCft = Number(totalCft.toFixed(2));
      totalCbm = Number(totalCbm.toFixed(2));
      const totalWeightKg = Number((totalWeightLbs * 0.453592).toFixed(1));

      list[index] = {
        ...list[index],
        ...(updatedReceipt || updates),
        packages,
        packageCount: packages.length || list[index].packageCount,
        totalPieces,
        weightLbs: totalWeightLbs,
        weightKg: totalWeightKg,
        cft: totalCft,
        cbm: totalCbm
      };
      setStored(KEYS.WAREHOUSE_RECEIPTS, list);

      // Update linked cargo
      const cargoList = getStored(KEYS.CARGO, []);
      const cargoIdx = cargoList.findIndex(c => c.warehouseReceiptId === id || c.receiptNumber === id);
      if (cargoIdx !== -1) {
        cargoList[cargoIdx] = {
          ...cargoList[cargoIdx],
          customer: updates.customer || cargoList[cargoIdx].customer,
          description: updates.cargoDescription || cargoList[cargoIdx].description,
          packageCount: packages.length || cargoList[cargoIdx].packageCount,
          totalPieces,
          weightLbs: totalWeightLbs,
          cft: totalCft,
          cbm: totalCbm,
          warehouseLocation: updates.warehouseLocation || cargoList[cargoIdx].warehouseLocation,
          destinationPort: updates.destinationPort || cargoList[cargoIdx].destinationPort,
          status: updates.status || cargoList[cargoIdx].status
        };
        setStored(KEYS.CARGO, cargoList);
      }

      await auditService.logAction(
        currentUser,
        "Warehouse Receipt",
        "Updated Warehouse Receipt",
        id,
        `Updated details for ${id} (${list[index].customer || list[index].customerName}).`
      );

      return list[index];
    }
    return updatedReceipt;
  },

  async deleteReceipt(id, currentUser = "Warehouse Staff") {
    try {
      await apiClient.delete(`warehouse-receipts/${encodeURIComponent(id)}`);
    } catch (err) {
      console.warn(`Backend deleteReceipt ${id} failed:`, err?.message || err);
    }

    const list = getStored(KEYS.WAREHOUSE_RECEIPTS, []);
    const existing = list.find(item => item.id === id || item.receiptNumber === id);
    const filtered = list.filter(item => item.id !== id && item.receiptNumber !== id);
    setStored(KEYS.WAREHOUSE_RECEIPTS, filtered);

    // Also remove from cargo if exists
    const cargoList = getStored(KEYS.CARGO, []);
    const filteredCargo = cargoList.filter(c => c.warehouseReceiptId !== id && c.receiptNumber !== id);
    setStored(KEYS.CARGO, filteredCargo);

    if (existing) {
      await auditService.logAction(
        currentUser,
        "Warehouse Receipt",
        "Deleted Warehouse Receipt",
        id,
        `Deleted ${id} for customer ${existing.customer || existing.customerName}.`
      );
    }

    return true;
  }
};
