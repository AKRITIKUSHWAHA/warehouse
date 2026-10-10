import { getStored, setStored, KEYS } from './storageService';
import { auditService } from './auditService';
import { apiClient } from './apiClient';

export const customerService = {
  async getCustomers(filters = {}) {
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.destination && filters.destination !== 'All') params.destinationCode = filters.destination;
      if (filters.status && filters.status !== 'All') params.status = filters.status;
      params.limit = 100;

      const res = await apiClient.get('customers', { params });

      if (res && res.data) {
        const rawList = Array.isArray(res.data) ? res.data : (res.data.items || res.data.customers || []);
        const mapped = rawList.map(c => ({
          ...c,
          customerNumber: c.customerNumber || c.id,
          telephone: c.telephone || c.phone || '',
          createdDate: c.createdDate || (c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '2026-10-01'),
        }));
        setStored(KEYS.CUSTOMERS, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Backend customers API notice, using local store:', err?.message || err);
    }

    const list = getStored(KEYS.CUSTOMERS, []);
    let filtered = [...list];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.customerNumber?.toLowerCase().includes(q) ||
        item.name?.toLowerCase().includes(q) ||
        item.contactPerson?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.telephone?.includes(q) ||
        item.phone?.includes(q) ||
        item.destinationPort?.toLowerCase().includes(q)
      );
    }
    if (filters.destination && filters.destination !== 'All') {
      filtered = filtered.filter(item => item.destinationCode === filters.destination);
    }
    if (filters.status && filters.status !== 'All') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    return filtered;
  },

  async getCustomerById(id) {
    if (!id) return null;
    try {
      const res = await apiClient.get(`customers/${encodeURIComponent(id)}`);
      const apiData = res?.data || res;
      if (apiData && (apiData.id || apiData.customerNumber)) {
        const mapped = {
          ...apiData,
          customerNumber: apiData.customerNumber || apiData.id,
          telephone: apiData.telephone || apiData.phone || '',
          createdDate: apiData.createdDate || (apiData.createdAt ? new Date(apiData.createdAt).toISOString().split('T')[0] : '2026-10-01'),
        };
        const list = getStored(KEYS.CUSTOMERS, []);
        const idx = list.findIndex(c => c.id === mapped.id || c.customerNumber === mapped.customerNumber);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...mapped };
        } else {
          list.push(mapped);
        }
        setStored(KEYS.CUSTOMERS, list);
        return mapped;
      }
    } catch (err) {
      console.warn(`Backend API fetch for customer ${id} failed:`, err?.message || err);
    }

    const list = getStored(KEYS.CUSTOMERS, []);
    return list.find(item => item.id === id || item.customerNumber === id || item.name === id) || null;
  },

  async createCustomer(data, currentUser = "Warehouse Staff") {
    const list = getStored(KEYS.CUSTOMERS, []);
    const nextSeq = list.length + 1;
    const fallbackId = data.customerNumber || `CUS-2026-${String(nextSeq).padStart(4, '0')}`;

    const payload = {
      name: data.name || data.companyName || "New Customer",
      companyName: data.companyName || data.name || "New Customer",
      contactPerson: data.contactPerson || "",
      email: data.email || "",
      telephone: data.telephone || data.phone || "",
      phone: data.telephone || data.phone || "",
      address: data.address || "",
      destinationPort: data.destinationPort || "Port of Nassau (BSNAS)",
      destinationCode: data.destinationCode || "NAS",
      taxId: data.taxId || "",
      accountType: data.accountType || "Commercial Importer",
      creditTerms: data.creditTerms || "Net 30",
      notes: data.notes || "",
      status: data.status || "Active"
    };

    let createdCustomer = null;
    try {
      const res = await apiClient.post('customers', payload);
      if (res && res.data) {
        createdCustomer = {
          ...res.data,
          customerNumber: res.data.customerNumber || res.data.id || fallbackId,
          telephone: res.data.telephone || res.data.phone || payload.telephone || '',
          createdDate: res.data.createdDate || (res.data.createdAt ? new Date(res.data.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        };
      }
    } catch (err) {
      console.error('Backend createCustomer error:', err?.message || err);
      throw err;
    }

    if (!createdCustomer) {
      createdCustomer = {
        ...payload,
        id: fallbackId,
        customerNumber: fallbackId,
        createdDate: data.createdDate || new Date().toISOString().split('T')[0],
      };
    }

    const updated = [createdCustomer, ...list.filter(c => c.id !== createdCustomer.id && c.customerNumber !== createdCustomer.customerNumber)];
    setStored(KEYS.CUSTOMERS, updated);

    await auditService.logAction(
      currentUser,
      "Customer",
      "Created Customer Profile",
      createdCustomer.customerNumber || createdCustomer.id,
      `Registered customer ${createdCustomer.name} (${createdCustomer.customerNumber}, ${createdCustomer.destinationPort}).`
    );

    return createdCustomer;
  },

  async updateCustomer(id, updates, currentUser = "Warehouse Staff") {
    let apiUpdated = null;
    try {
      const payload = {
        name: updates.name || updates.companyName,
        companyName: updates.companyName || updates.name,
        contactPerson: updates.contactPerson,
        email: updates.email,
        telephone: updates.telephone || updates.phone,
        phone: updates.telephone || updates.phone,
        address: updates.address,
        destinationPort: updates.destinationPort,
        destinationCode: updates.destinationCode || (updates.destinationPort ? updates.destinationPort.split(' - ')[0] : undefined),
        taxId: updates.taxId,
        accountType: updates.accountType,
        creditTerms: updates.creditTerms,
        notes: updates.notes,
        status: updates.status,
      };

      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      const res = await apiClient.patch(`customers/${encodeURIComponent(id)}`, payload);
      if (res && res.data) {
        apiUpdated = {
          ...res.data,
          customerNumber: res.data.customerNumber || res.data.id,
          telephone: res.data.telephone || res.data.phone || updates.telephone || '',
          createdDate: res.data.createdDate || (res.data.createdAt ? new Date(res.data.createdAt).toISOString().split('T')[0] : '2026-10-01'),
        };
      }
    } catch (err) {
      console.error(`Backend updateCustomer ${id} failed:`, err?.message || err);
      throw err;
    }

    const list = getStored(KEYS.CUSTOMERS, []);
    const index = list.findIndex(item => item.id === id || item.customerNumber === id);
    if (index !== -1) {
      const merged = {
        ...list[index],
        ...updates,
        ...(apiUpdated || {}),
        telephone: updates.telephone || updates.phone || list[index].telephone || '',
        phone: updates.telephone || updates.phone || list[index].phone || ''
      };
      list[index] = merged;
      setStored(KEYS.CUSTOMERS, list);

      const refNumber = merged.customerNumber || id;
      await auditService.logAction(
        currentUser,
        "Customer",
        "Updated Customer Profile",
        refNumber,
        `Updated customer profile for ${merged.name} (${refNumber}).`
      );

      return merged;
    } else if (apiUpdated) {
      list.unshift(apiUpdated);
      setStored(KEYS.CUSTOMERS, list);
      return apiUpdated;
    }
    return apiUpdated;
  },

  async deleteCustomer(id, currentUser = "Super Admin") {
    try {
      await apiClient.delete(`customers/${encodeURIComponent(id)}`);
    } catch (err) {
      console.error(`Backend deleteCustomer ${id} failed:`, err?.message || err);
      throw err;
    }

    const list = getStored(KEYS.CUSTOMERS, []);
    const existing = list.find(item => item.id === id || item.customerNumber === id);
    const filtered = list.filter(item => item.id !== id && item.customerNumber !== id);
    setStored(KEYS.CUSTOMERS, filtered);

    const refNumber = existing?.customerNumber || id;
    await auditService.logAction(
      currentUser,
      "Customer",
      "Deleted Customer Profile",
      refNumber,
      `Deleted customer profile ${existing?.name || refNumber} (${refNumber}).`
    );

    return true;
  }
};
