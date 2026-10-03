import { getStored, setStored, KEYS } from './storageService';
import { auditService } from './auditService';
import { apiClient } from './apiClient';
import { apiFetch } from './apiConfig';

export const shipmentService = {
  async getShipments(filters = {}) {
    try {
      const res = await apiClient.get('shipments', { params: { ...filters, limit: 100 } });
      if (res && (res.data !== undefined || Array.isArray(res))) {
        const raw = res.data !== undefined ? res.data : res;
        const liveList = Array.isArray(raw) ? raw : (raw?.items || raw?.shipments || []);
        setStored(KEYS.SHIPMENTS, liveList);
        return liveList;
      }
    } catch (err) {
      console.warn('Backend API /shipments fetch failed, using cached store:', err?.message || err);
    }

    // Fallback to local cache
    const list = getStored(KEYS.SHIPMENTS, []);
    let filtered = [...list];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.shipmentNumber?.toLowerCase().includes(q) ||
        item.trackingNumber?.toLowerCase().includes(q) ||
        item.vesselName?.toLowerCase().includes(q) ||
        item.destinationPort?.toLowerCase().includes(q) ||
        item.containerNumber?.toLowerCase().includes(q) ||
        item.billOfLadingNumber?.toLowerCase().includes(q) ||
        item.agentName?.toLowerCase().includes(q)
      );
    }
    if (filters.status && filters.status !== 'All') {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    if (filters.destination && filters.destination !== 'All') {
      filtered = filtered.filter(item => item.destinationCode === filters.destination);
    }
    if (filters.agentId && filters.agentId !== 'All') {
      filtered = filtered.filter(item => item.agentId === filters.agentId);
    }

    return filtered;
  },

  async getShipmentById(id) {
    if (!id) return null;
    try {
      const res = await apiClient.get(`shipments/${encodeURIComponent(id)}`);
      const data = res?.data !== undefined ? res.data : res;
      if (data && (data.id || data.shipmentNumber)) {
        return data;
      }
    } catch (err) {
      console.warn(`Backend API fetch for shipment ${id} failed:`, err?.message || err);
    }

    const list = getStored(KEYS.SHIPMENTS, []);
    return list.find(item => item.id === id || item.shipmentNumber === id || item.trackingNumber === id) || null;
  },

  async createShipment(data, currentUser = "Operations Staff") {
    let createdShipment = null;
    try {
      const res = await apiClient.post('shipments', data);
      const resData = res?.data !== undefined ? res.data : res;
      if (resData && (resData.id || resData.shipmentNumber)) {
        createdShipment = resData;
      }
    } catch (err) {
      console.warn('Backend createShipment failed, storing locally:', err?.message || err);
    }

    if (!createdShipment) {
      const list = getStored(KEYS.SHIPMENTS, []);
      const id = data.shipmentNumber || `SHP-2026-${292 + list.length}`;
      createdShipment = {
        ...data,
        id,
        shipmentNumber: id,
        trackingNumber: data.trackingNumber || `TRK-VI-${Math.floor(100000 + Math.random() * 900000)}`,
        createdDate: data.createdDate || new Date().toISOString().split('T')[0],
        status: data.status || "Cargo Received",
        blStatus: data.blStatus || "Draft",
        trackingCheckpoints: data.trackingCheckpoints || [
          {
            id: `chk-${Date.now()}-1`,
            stage: "Cargo Received",
            status: "Completed",
            date: new Date().toISOString().split('T')[0],
            time: "08:30 AM",
            location: data.origin || "Miami CFS Warehouse",
            notes: "Shipment registered in system."
          },
          {
            id: `chk-${Date.now()}-2`,
            stage: "Consolidated",
            status: "Active",
            date: new Date().toISOString().split('T')[0],
            time: "10:00 AM",
            location: "Consolidation Hub",
            notes: "Cargo staging underway."
          },
          { id: `chk-${Date.now()}-3`, stage: "Loaded & Sealed", status: "Pending", date: data.etd || "2026-09-02", notes: "Container loading pending." },
          { id: `chk-${Date.now()}-4`, stage: "In Transit", status: "Pending", date: data.etd || "2026-09-03", notes: "Vessel transit." },
          { id: `chk-${Date.now()}-5`, stage: "Arrived at Port", status: "Pending", date: data.eta || "2026-09-08", notes: "Port arrival." },
          { id: `chk-${Date.now()}-6`, stage: "Delivered / Released", status: "Pending", date: "2026-09-09", notes: "Final clearance." }
        ]
      };
    }

    const list = getStored(KEYS.SHIPMENTS, []);
    const updated = [createdShipment, ...list.filter(s => s.id !== createdShipment.id && s.shipmentNumber !== createdShipment.shipmentNumber)];
    setStored(KEYS.SHIPMENTS, updated);

    await auditService.logAction(
      currentUser,
      "Shipments",
      "Created Shipment",
      createdShipment.id,
      `Created Master Shipment ${createdShipment.shipmentNumber} (${createdShipment.origin} → ${createdShipment.destinationPort}).`
    );

    return createdShipment;
  },

  async updateShipment(id, updates, currentUser = "Operations Staff") {
    let updatedShipment = null;
    try {
      let res;
      try {
        res = await apiClient.patch(`shipments/${encodeURIComponent(id)}`, updates);
      } catch {
        res = await apiClient.put(`shipments/${encodeURIComponent(id)}`, updates);
      }
      const resData = res?.data !== undefined ? res.data : res;
      if (resData && (resData.id || resData.shipmentNumber)) {
        updatedShipment = resData;
      }
    } catch (err) {
      console.warn(`Backend updateShipment ${id} failed:`, err?.message || err);
    }

    const list = getStored(KEYS.SHIPMENTS, []);
    const index = list.findIndex(item => item.id === id || item.shipmentNumber === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...(updatedShipment || updates) };
      setStored(KEYS.SHIPMENTS, list);
      updatedShipment = list[index];
    }

    await auditService.logAction(
      currentUser,
      "Shipments",
      "Updated Shipment",
      id,
      `Updated shipment details for ${id}.`
    );

    return updatedShipment;
  },

  async deleteShipment(id, currentUser = "Operations Staff") {
    try {
      await apiClient.delete(`shipments/${encodeURIComponent(id)}`);
    } catch (err) {
      console.warn(`Backend deleteShipment ${id} failed:`, err?.message || err);
    }

    const list = getStored(KEYS.SHIPMENTS, []);
    const existing = list.find(item => item.id === id || item.shipmentNumber === id);
    const filtered = list.filter(item => item.id !== id && item.shipmentNumber !== id);
    setStored(KEYS.SHIPMENTS, filtered);

    if (existing) {
      await auditService.logAction(
        currentUser,
        "Shipments",
        "Deleted Shipment",
        id,
        `Deleted Master Shipment ${id} (${existing.shipmentNumber}).`
      );
    }

    return true;
  }
};
