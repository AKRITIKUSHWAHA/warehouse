import { getStored, setStored, KEYS } from './storageService';
import { auditService } from './auditService';
import { customerService } from './customerService';
import { houseBillService } from './houseBillService';
import { portService } from './portService';
import { apiFetch } from './apiConfig';
import { settingsService } from './settingsService';
import { adminService } from './adminService';
import { apiClient } from './apiClient';

export { customerService, houseBillService, portService, settingsService, adminService, apiClient, apiFetch };



export const vesselService = {
  async getVessels() {
    try {
      const res = await apiClient.get('vessels');
      if (res && res.data) {
        const items = Array.isArray(res.data) ? res.data : (res.data.items || res.data.vessels || []);
        setStored(KEYS.VESSELS, items);
        return items;
      }
    } catch (e) {
      console.warn('[vesselService] API getVessels failed, using fallback:', e.message);
    }
    return getStored(KEYS.VESSELS, []);
  },

  async createVessel(data, currentUser = "Operations Staff") {
    let created = null;
    try {
      const payload = {
        name: data.name,
        type: data.type || "Container Vessel",
        carrier: data.carrier || "",
        notes: data.notes || ""
      };
      const res = await apiClient.post('vessels', payload);
      if (res && res.data) {
        created = res.data;
      }
    } catch (e) {
      console.warn('[vesselService] API createVessel failed, using local fallback:', e.message);
    }

    const list = getStored(KEYS.VESSELS);
    const id = created?.id || data.id || `vsl-${Date.now()}`;
    const newVessel = created || {
      ...data,
      id,
      name: data.name,
      type: data.type || "Container Vessel",
      carrier: data.carrier || "",
      notes: data.notes || ""
    };

    const updated = [newVessel, ...list.filter(v => v.id !== newVessel.id && v.name !== newVessel.name)];
    setStored(KEYS.VESSELS, updated);

    await auditService.logAction(
      currentUser,
      "Fleet Directory",
      "Created Vessel Record",
      newVessel.name,
      `Added vessel ${newVessel.name} to fleet.`
    );

    return newVessel;
  },

  async updateVessel(id, updates, currentUser = "Operations Staff") {
    let updatedItem = null;
    try {
      const res = await apiClient.patch(`vessels/${id}`, updates);
      if (res && res.data) {
        updatedItem = res.data;
      }
    } catch (e) {
      console.warn('[vesselService] API updateVessel failed, using local fallback:', e.message);
    }

    const list = getStored(KEYS.VESSELS);
    const index = list.findIndex(item => item.id === id || item.name === id);
    if (index !== -1) {
      list[index] = updatedItem || { ...list[index], ...updates };
      setStored(KEYS.VESSELS, list);

      await auditService.logAction(
        currentUser,
        "Fleet Directory",
        "Updated Vessel Record",
        list[index].name,
        `Updated vessel details for ${list[index].name}.`
      );

      return list[index];
    }
    return updatedItem;
  },

  async deleteVessel(id, currentUser = "Operations Staff") {
    try {
      await apiClient.delete(`vessels/${id}`);
    } catch (e) {
      console.warn('[vesselService] API deleteVessel failed, using local fallback:', e.message);
    }

    const list = getStored(KEYS.VESSELS);
    const existing = list.find(item => item.id === id || item.name === id);
    if (!existing) return false;

    const filtered = list.filter(item => item.id !== id && item.name !== id);
    setStored(KEYS.VESSELS, filtered);

    await auditService.logAction(
      currentUser,
      "Fleet Directory",
      "Deleted Vessel Record",
      existing.name,
      `Deleted vessel ${existing.name}.`
    );

    return true;
  }
};

export const agentService = {
  async getAgents(filters = {}) {
    try {
      const res = await apiClient.get('agents');
      if (res && res.data) {
        const items = Array.isArray(res.data) ? res.data : (res.data.items || res.data.agents || []);
        if (items.length > 0) {
          setStored(KEYS.AGENTS, items);
          return items;
        }
      }
    } catch (e) {
      console.warn('[agentService] API getAgents failed, using fallback:', e.message);
    }
    const list = getStored(KEYS.AGENTS);
    let filtered = [...list];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(q) ||
        item.agentCode?.toLowerCase().includes(q) ||
        item.contactPerson?.toLowerCase().includes(q) ||
        item.territory?.toLowerCase().includes(q)
      );
    }
    return filtered;
  },

  async getAgentById(id) {
    try {
      const res = await apiClient.get(`agents/${id}`);
      if (res && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('[agentService] API getAgentById failed, using fallback:', e.message);
    }
    const list = getStored(KEYS.AGENTS);
    return list.find(item => item.id === id || item.agentCode === id) || null;
  },

  async createAgent(data, currentUser = "Operations Staff") {
    let created = null;
    try {
      const payload = {
        name: data.name,
        agentCode: data.agentCode || `AGT-CARIB-${Math.floor(10 + Math.random() * 90)}`,
        territory: data.territory || "Caribbean Sea",
        contactPerson: data.contactPerson || "Agent Representative",
        email: data.email || "agent@ports.com",
        phone: data.phone || "+1 (242) 555-0199",
        address: data.address || "Main Harbour Terminal",
        assignedPortCode: data.assignedPortCode || "NAS",
        creditLimitUsd: String(data.creditLimitUsd || 50000)
      };
      const res = await apiClient.post('agents', payload);
      if (res && res.data) {
        created = res.data;
      }
    } catch (e) {
      console.warn('[agentService] API createAgent failed, using local fallback:', e.message);
    }

    const list = getStored(KEYS.AGENTS);
    const id = created?.id || data.id || `AGT-${data.agentCode || Math.floor(100 + Math.random() * 900)}`;
    const newAgent = created || {
      ...data,
      id,
      name: data.name || "Caribbean Port Logistics",
      agentCode: data.agentCode || `AGT-CARIB-${Math.floor(10 + Math.random() * 90)}`,
      territory: data.territory || "Caribbean Sea",
      contactPerson: data.contactPerson || "Agent Representative",
      email: data.email || "agent@ports.com",
      phone: data.phone || "+1 (242) 555-0199",
      address: data.address || "Main Harbour Terminal",
      status: data.status || "Active Agent",
      creditLimitUsd: Number(data.creditLimitUsd) || 50000,
      activeShipmentsCount: Number(data.activeShipmentsCount) || 0,
      assignedShipments: data.assignedShipments || []
    };

    const updated = [newAgent, ...list.filter(a => a.id !== newAgent.id && a.agentCode !== newAgent.agentCode)];
    setStored(KEYS.AGENTS, updated);

    await auditService.logAction(
      currentUser,
      "Agent Management",
      "Created Port Agent",
      newAgent.agentCode,
      `Registered new port agent ${newAgent.name} (${newAgent.territory}).`
    );

    return newAgent;
  },

  async updateAgent(id, updates, currentUser = "Operations Staff") {
    let updatedItem = null;
    try {
      const res = await apiClient.patch(`agents/${id}`, updates);
      if (res && res.data) {
        updatedItem = res.data;
      }
    } catch (e) {
      console.warn('[agentService] API updateAgent failed, using local fallback:', e.message);
    }

    const list = getStored(KEYS.AGENTS);
    const index = list.findIndex(item => item.id === id || item.agentCode === id);
    if (index !== -1) {
      list[index] = updatedItem || { ...list[index], ...updates };
      setStored(KEYS.AGENTS, list);

      await auditService.logAction(
        currentUser,
        "Agent Management",
        "Updated Port Agent",
        list[index].agentCode,
        `Updated agent ${list[index].name} (${list[index].agentCode}).`
      );

      return list[index];
    }
    return updatedItem;
  },

  async deleteAgent(id, currentUser = "Operations Staff") {
    try {
      await apiClient.delete(`agents/${id}`);
    } catch (e) {
      console.warn('[agentService] API deleteAgent failed, using local fallback:', e.message);
    }

    const list = getStored(KEYS.AGENTS);
    const existing = list.find(item => item.id === id || item.agentCode === id);
    if (!existing) return false;

    const filtered = list.filter(item => item.id !== id && item.agentCode !== id);
    setStored(KEYS.AGENTS, filtered);

    await auditService.logAction(
      currentUser,
      "Agent Management",
      "Deleted Port Agent",
      existing.agentCode,
      `Deleted agent ${existing.name} (${existing.agentCode}).`
    );

    return true;
  }
};

export const userService = {
  async getUsers() {
    try {
      const res = await apiClient.get('users');
      if (res && res.data) {
        const users = Array.isArray(res.data) ? res.data : (res.data.items || res.data.users || []);
        if (users.length > 0) return users;
      }
    } catch (e) {
      console.warn('[userService] Failed to fetch users from API, using fallback:', e.message);
    }
    return getStored(KEYS.USERS);
  },

  async createUser(data, currentUser = "Super Admin") {
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        roleKey: data.roleKey || 'operations',
        department: data.department || 'Operations',
        phone: data.phone || '',
        status: data.status || 'Active',
      };
      const res = await apiClient.post('users', payload);
      if (res && res.data) {
        const createdUser = res.data;
        const currentList = getStored(KEYS.USERS);
        const updated = [createdUser, ...currentList.filter(u => u.id !== createdUser.id && u.email !== createdUser.email)];
        setStored(KEYS.USERS, updated);
        return createdUser;
      }
    } catch (e) {
      console.warn('[userService] API create user failed, using local storage:', e.message);
    }

    const list = getStored(KEYS.USERS);
    const id = data.id || `USR-${String(list.length + 1).padStart(3, '0')}`;
    const initials = data.name
      ? data.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'US';

    const newUser = {
      ...data,
      id,
      name: data.name || "New Staff Member",
      email: data.email || `staff${list.length + 1}@vicustoms.com`,
      role: data.role || "Operations Coordinator",
      roleKey: data.roleKey || "operations",
      department: data.department || "Operations & Freight Logistics",
      avatar: data.avatar || initials,
      status: data.status || "Active",
      password: data.password,
      lastLogin: "Never"
    };

    const updated = [newUser, ...list];
    setStored(KEYS.USERS, updated);

    await auditService.logAction(
      currentUser,
      "User Management",
      "Created User Account",
      newUser.id,
      `Created staff account for ${newUser.name} (${newUser.role}).`
    );

    return newUser;
  },

  async updateUser(id, updates, currentUser = "Super Admin") {
    try {
      const res = await apiClient.patch(`users/${id}`, updates);
      if (res && res.data) {
        const updatedUser = res.data;
        const list = getStored(KEYS.USERS);
        const index = list.findIndex(item => item.id === id || item.email === id);
        if (index !== -1) {
          list[index] = { ...list[index], ...updatedUser };
          setStored(KEYS.USERS, list);
        }
        return updatedUser;
      }
    } catch (e) {
      console.warn('[userService] API update user failed, using local storage:', e.message);
    }

    const list = getStored(KEYS.USERS);
    const index = list.findIndex(item => item.id === id || item.email === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      setStored(KEYS.USERS, list);

      await auditService.logAction(
        currentUser,
        "User Management",
        "Updated User Account",
        list[index].id,
        `Updated account details for ${list[index].name}.`
      );

      return list[index];
    }
    return null;
  },

  async deleteUser(id, currentUser = "Super Admin") {
    try {
      await apiClient.delete(`users/${id}`);
      return true;
    } catch (e) {
      console.warn('[userService] API delete user failed, using local storage:', e.message);
    }

    const list = getStored(KEYS.USERS);
    const existing = list.find(item => item.id === id || item.email === id);
    if (!existing) return false;

    const filtered = list.filter(item => item.id !== id && item.email !== id);
    setStored(KEYS.USERS, filtered);

    await auditService.logAction(
      currentUser,
      "User Management",
      "Deleted User Account",
      existing.id,
      `Deleted user account ${existing.name} (${existing.email}).`
    );

    return true;
  }
};

export const documentService = {
  async getDocuments() {
    return getStored(KEYS.DOCUMENTS, []);
  },

  async uploadDocument(data, currentUser = "Documentation Staff") {
    const list = getStored(KEYS.DOCUMENTS, []);
    const id = data.id || `DOC-2026-${Math.floor(1000 + list.length + 1)}`;
    const newDoc = {
      ...data,
      id,
      docNumber: data.docNumber || id,
      docType: data.docType || "Commercial Invoice",
      entityType: "CUSTOM_DOC",
      title: data.title || "Custom Attached Document",
      date: data.date || new Date().toISOString().split('T')[0],
      party: data.party || "Customer / Carrier",
      status: data.status || "Active",
      fileName: data.fileName || "document_attachment.pdf",
      fileSize: data.fileSize || "1.2 MB",
      notes: data.notes || ""
    };

    const updated = [newDoc, ...list];
    setStored(KEYS.DOCUMENTS, updated);

    await auditService.logAction(
      currentUser,
      "Document Center",
      "Uploaded Document",
      id,
      `Uploaded document ${newDoc.title} (${newDoc.docType}).`
    );

    return newDoc;
  },

  async deleteDocument(id, currentUser = "Documentation Staff") {
    const list = getStored(KEYS.DOCUMENTS, []);
    const existing = list.find(item => item.id === id || item.docNumber === id);
    if (!existing) return false;

    const filtered = list.filter(item => item.id !== id && item.docNumber !== id);
    setStored(KEYS.DOCUMENTS, filtered);

    await auditService.logAction(
      currentUser,
      "Document Center",
      "Deleted Document",
      id,
      `Deleted document ${existing.title} (${id}).`
    );

    return true;
  }
};

export const trackingService = {
  async track(query) {
    if (!query) return null;
    const clean = query.trim().toUpperCase();

    // 1. Live Backend API Query
    try {
      const res = await apiFetch(`/tracking/${encodeURIComponent(clean)}`);
      if (res?.data) {
        return {
          type: res.data.type || 'shipment',
          data: {
            ...res.data,
            trackingCheckpoints: res.data.events || res.data.trackingCheckpoints || []
          }
        };
      }
    } catch (err) {
      // If 404 or backend lookup failed, continue to fallback search
    }

    // 2. Fallback Search in shipments
    const shipments = getStored(KEYS.SHIPMENTS);
    const matchedShipment = shipments.find(s =>
      s.trackingNumber?.toUpperCase() === clean ||
      s.shipmentNumber?.toUpperCase() === clean ||
      s.billOfLadingNumber?.toUpperCase() === clean ||
      s.containerNumber?.toUpperCase() === clean
    );
    if (matchedShipment) return { type: 'shipment', data: matchedShipment };

    // 3. Fallback Search in House Bills of Lading
    const houseBills = getStored(KEYS.HOUSE_BILLS);
    const matchedHBL = houseBills.find(h => h.hblNumber?.toUpperCase() === clean);
    if (matchedHBL) {
      const parentShipment = shipments.find(s => s.id === matchedHBL.assignedShipmentId || s.houseBillIds?.includes(matchedHBL.hblNumber));
      return { type: 'house_bill', data: matchedHBL, shipment: parentShipment };
    }

    // 4. Fallback Search in warehouse receipts
    const receipts = getStored(KEYS.WAREHOUSE_RECEIPTS);
    const matchedWR = receipts.find(w =>
      w.receiptNumber?.toUpperCase() === clean ||
      w.barcode?.toUpperCase() === clean
    );
    if (matchedWR) return { type: 'warehouse_receipt', data: matchedWR };

    // 5. Fallback Search in Master Bills of Lading
    const bls = getStored(KEYS.BILLS_OF_LADING);
    const matchedBL = bls.find(b => b.blNumber?.toUpperCase() === clean);
    if (matchedBL) {
      const parentShipment = shipments.find(s => s.id === matchedBL.shipmentId || s.billOfLadingId === matchedBL.id);
      return { type: 'bill_of_lading', data: matchedBL, shipment: parentShipment };
    }

    return null;
  }
};

export const searchService = {
  async search(query) {
    if (!query || query.trim().length < 2) return { customers: [], houseBills: [], shipments: [], receipts: [], bls: [], agents: [] };
    const q = query.trim().toLowerCase();

    const customers = getStored(KEYS.CUSTOMERS).filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.customerNumber?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.telephone?.toLowerCase().includes(q)
    ).slice(0, 5);

    const houseBills = getStored(KEYS.HOUSE_BILLS).filter(h =>
      h.hblNumber?.toLowerCase().includes(q) ||
      h.customerName?.toLowerCase().includes(q) ||
      h.consignee?.name?.toLowerCase().includes(q) ||
      h.cargoDescription?.toLowerCase().includes(q)
    ).slice(0, 5);

    const shipments = getStored(KEYS.SHIPMENTS).filter(s =>
      s.shipmentNumber?.toLowerCase().includes(q) ||
      s.trackingNumber?.toLowerCase().includes(q) ||
      s.destinationPort?.toLowerCase().includes(q)
    ).slice(0, 5);

    const receipts = getStored(KEYS.WAREHOUSE_RECEIPTS).filter(r =>
      r.receiptNumber?.toLowerCase().includes(q) ||
      r.customer?.toLowerCase().includes(q) ||
      r.cargoDescription?.toLowerCase().includes(q)
    ).slice(0, 5);

    const bls = getStored(KEYS.BILLS_OF_LADING).filter(b =>
      b.blNumber?.toLowerCase().includes(q) ||
      b.consignee?.name?.toLowerCase().includes(q)
    ).slice(0, 5);

    const agents = getStored(KEYS.AGENTS).filter(a =>
      a.name?.toLowerCase().includes(q) ||
      a.territory?.toLowerCase().includes(q)
    ).slice(0, 5);

    return { customers, houseBills, shipments, receipts, bls, agents };
  }
};
