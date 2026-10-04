import { getStored, setStored, KEYS } from './storageService';
import { auditService } from './auditService';
import { apiClient } from './apiClient';
import { apiFetch } from './apiConfig';

export const billOfLadingService = {
  async getBillsOfLading(filters = {}) {
    try {
      const res = await apiClient.get('bills-of-lading', { params: { ...filters, limit: 100 } });
      if (res && res.data) {
        const liveList = Array.isArray(res.data) ? res.data : (res.data.items || []);
        setStored(KEYS.BILLS_OF_LADING, liveList);
        return liveList;
      }
    } catch (err) {
      console.warn('API error fetching bills of lading, fallback to local:', err?.message || err);
    }

    const list = getStored(KEYS.BILLS_OF_LADING, []);
    let filtered = [...list];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.blNumber?.toLowerCase().includes(q) ||
        item.consignee?.name?.toLowerCase().includes(q) ||
        item.shipper?.name?.toLowerCase().includes(q) ||
        item.oceanVessel?.toLowerCase().includes(q) ||
        item.containerNumber?.toLowerCase().includes(q) ||
        item.agentName?.toLowerCase().includes(q)
      );
    }
    if (filters.status && filters.status !== 'All') {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    if (filters.agentId && filters.agentId !== 'All') {
      filtered = filtered.filter(item => item.agentId === filters.agentId || item.consignee?.agentId === filters.agentId);
    }

    return filtered;
  },

  async getBillOfLadingById(id) {
    if (!id) return null;
    try {
      const res = await apiClient.get(`bills-of-lading/${encodeURIComponent(id)}`);
      if (res && res.data) return res.data;
    } catch (err) {
      console.warn(`API error fetching bill of lading by id ${id}:`, err?.message || err);
    }

    const list = getStored(KEYS.BILLS_OF_LADING, []);
    return list.find(item => item.id === id || item.blNumber === id) || null;
  },

  async createBillOfLading(data, currentUser = "Documentation Staff") {
    let createdBL = null;
    try {
      const res = await apiClient.post('bills-of-lading', data);
      if (res && res.data) {
        createdBL = res.data;
      }
    } catch (err) {
      console.warn('Backend createBillOfLading failed:', err?.message || err);
      throw err;
    }

    if (!createdBL) {
      const list = getStored(KEYS.BILLS_OF_LADING, []);
      const id = data.blNumber || `BL-VI-2026-${96 + list.length}`;
      createdBL = {
        ...data,
        id,
        blNumber: id,
        type: "Master Ocean Bill of Lading",
        createdDate: data.issueDate || new Date().toISOString().split('T')[0],
        status: data.status || "Draft",
        holdDetails: { isOnHold: false },
        charges: [
          { description: "Ocean Freight (Port to Port)", rate: "LCL Consolidated CBM", amount: Number(((data.cbm || 1) * 145).toFixed(2)), prepaid: true },
          { description: "Terminal Handling Charges (THC)", rate: "Flat Container Surcharge", amount: 280.00, prepaid: true },
          { description: "Documentation & Electronic Customs Filing", rate: "Flat Filing Fee", amount: 75.00, prepaid: true }
        ],
        totalFreightUsd: Number((((data.cbm || 1) * 145) + 355).toFixed(2))
      };
    }

    const list = getStored(KEYS.BILLS_OF_LADING, []);
    const updated = [createdBL, ...list.filter(b => b.id !== createdBL.id && b.blNumber !== createdBL.blNumber)];
    setStored(KEYS.BILLS_OF_LADING, updated);

    await auditService.logAction(
      currentUser,
      "Bill of Lading",
      "Created Master B/L",
      createdBL.blNumber || createdBL.id,
      `Issued Master Bill of Lading ${createdBL.blNumber} for ${createdBL.consignee?.name || 'Consignee'} (${createdBL.portOfLoading} → ${createdBL.portOfDischarge}).`
    );

    return createdBL;
  },

  async updateBillOfLading(id, updates, currentUser = "Documentation Staff") {
    let updatedBL = null;
    try {
      const res = await apiClient.patch(`bills-of-lading/${encodeURIComponent(id)}`, updates).catch(() =>
        apiClient.put(`bills-of-lading/${encodeURIComponent(id)}`, updates)
      );
      if (res && res.data) {
        updatedBL = res.data;
      }
    } catch (err) {
      console.warn(`Backend updateBillOfLading ${id} failed:`, err?.message || err);
      throw err;
    }

    const list = getStored(KEYS.BILLS_OF_LADING, []);
    const index = list.findIndex(item => item.id === id || item.blNumber === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...(updatedBL || updates) };
      setStored(KEYS.BILLS_OF_LADING, list);
      updatedBL = list[index];
    } else if (updatedBL) {
      setStored(KEYS.BILLS_OF_LADING, [updatedBL, ...list]);
    }

    await auditService.logAction(
      currentUser,
      "Bill of Lading",
      "Updated Master B/L",
      id,
      `Updated details for Master Bill of Lading ${id}.`
    );

    return updatedBL;
  },

  async updateStatus(id, status, currentUser = "Documentation Staff") {
    return this.updateBillOfLading(id, { status }, currentUser);
  },

  async deleteBillOfLading(id, currentUser = "Documentation Staff") {
    try {
      await apiClient.delete(`bills-of-lading/${encodeURIComponent(id)}`);
    } catch (err) {
      console.warn(`Backend deleteBillOfLading ${id} failed:`, err?.message || err);
      throw err;
    }

    const list = getStored(KEYS.BILLS_OF_LADING, []);
    const existing = list.find(item => item.id === id || item.blNumber === id);
    const filtered = list.filter(item => item.id !== id && item.blNumber !== id);
    setStored(KEYS.BILLS_OF_LADING, filtered);

    if (existing) {
      await auditService.logAction(
        currentUser,
        "Bill of Lading",
        "Deleted Master B/L",
        id,
        `Deleted Master Bill of Lading ${id} (${existing.blNumber}).`
      );
    }

    return true;
  },

  async placeHold(blId, reason, notes, currentUser = "Documentation Staff") {
    let apiUpdated = null;
    try {
      const res = await apiClient.post(`bills-of-lading/${encodeURIComponent(blId)}/hold`, { reason, holdNotes: notes });
      if (res && res.data) {
        apiUpdated = res.data;
      }
    } catch (err) {
      console.warn('API error placing bill of lading on hold:', err?.message || err);
      throw err;
    }

    const list = getStored(KEYS.BILLS_OF_LADING, []);
    const index = list.findIndex(item => item.id === blId || item.blNumber === blId);
    if (index === -1) {
      if (apiUpdated) {
        setStored(KEYS.BILLS_OF_LADING, [apiUpdated, ...list]);
        return apiUpdated;
      }
      return null;
    }

    const currentBL = list[index];
    const prevHoldDetails = currentBL.holdDetails || {};

    const updatedHoldDetails = {
      isOnHold: true,
      reason,
      notes,
      placedBy: typeof currentUser === 'string' ? currentUser : currentUser?.name || 'Staff',
      placedAt: new Date().toISOString(),
      history: [
        ...(prevHoldDetails.history || []),
        {
          action: "HOLD_PLACED",
          reason,
          notes,
          by: typeof currentUser === 'string' ? currentUser : currentUser?.name || 'Staff',
          timestamp: new Date().toISOString()
        }
      ]
    };

    list[index] = {
      ...currentBL,
      ...(apiUpdated || {}),
      status: apiUpdated?.status || "On Hold",
      holdDetails: apiUpdated?.holdDetails || updatedHoldDetails
    };

    setStored(KEYS.BILLS_OF_LADING, list);

    await auditService.logAction(
      currentUser,
      "Bill of Lading",
      "Placed B/L on Hold",
      blId,
      `Master B/L ${blId} placed on hold. Reason: ${reason}. Notes: ${notes || 'None'}`
    );

    return list[index];
  },

  async clearHold(blId, currentUser = "Super Admin", clearNotes = "") {
    let apiUpdated = null;
    try {
      const res = await apiClient.post(`bills-of-lading/${encodeURIComponent(blId)}/release`, { clearNotes });
      if (res && res.data) {
        apiUpdated = res.data;
      }
    } catch (err) {
      console.warn('API error clearing bill of lading hold:', err?.message || err);
      throw err;
    }

    const list = getStored(KEYS.BILLS_OF_LADING, []);
    const index = list.findIndex(item => item.id === blId || item.blNumber === blId);

    if (index === -1) {
      if (apiUpdated) {
        setStored(KEYS.BILLS_OF_LADING, [apiUpdated, ...list]);
        return apiUpdated;
      }
      return null;
    }

    const currentBL = list[index];
    const prevHoldDetails = currentBL.holdDetails || {};

    const updatedHoldDetails = {
      isOnHold: false,
      reason: null,
      notes: null,
      placedBy: null,
      placedAt: null,
      clearedBy: typeof currentUser === 'string' ? currentUser : currentUser?.name || 'Staff',
      clearedAt: new Date().toISOString(),
      clearNotes,
      history: [
        ...(prevHoldDetails.history || []),
        {
          action: "HOLD_CLEARED",
          notes: clearNotes,
          by: typeof currentUser === 'string' ? currentUser : currentUser?.name || 'Staff',
          timestamp: new Date().toISOString()
        }
      ]
    };

    list[index] = {
      ...currentBL,
      ...(apiUpdated || {}),
      status: apiUpdated?.status || "Released",
      holdDetails: apiUpdated?.holdDetails || updatedHoldDetails
    };

    setStored(KEYS.BILLS_OF_LADING, list);

    await auditService.logAction(
      currentUser,
      "Bill of Lading",
      "Cleared B/L Hold",
      blId,
      `Hold released on Master B/L ${blId} by ${typeof currentUser === 'string' ? currentUser : currentUser?.name || 'Staff'}. Notes: ${clearNotes || 'None'}`
    );

    return list[index];
  }
};
