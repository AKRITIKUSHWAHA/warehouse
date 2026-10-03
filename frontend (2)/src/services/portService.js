import { getStored, setStored, KEYS } from './storageService';
import { auditService } from './auditService';
import { apiClient } from './apiClient';

export const portService = {
  async getPorts(filters = {}) {
    try {
      const res = await apiClient.get('ports');
      if (res && res.data) {
        const ports = Array.isArray(res.data) ? res.data : (res.data.items || res.data.ports || []);
        if (ports.length > 0) {
          // Normalize code property so both code and portCode are accessible
          const mapped = ports.map(p => ({
            ...p,
            code: p.code || p.portCode,
            portCode: p.portCode || p.code,
          }));
          setStored(KEYS.PORTS, mapped);
          return mapped;
        }
      }
    } catch (e) {
      console.warn('[portService] Failed to fetch ports from API, using fallback:', e.message);
    }

    const list = getStored(KEYS.PORTS);
    let filtered = [...list];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.code?.toLowerCase().includes(q) ||
        item.name?.toLowerCase().includes(q) ||
        item.island?.toLowerCase().includes(q) ||
        item.country?.toLowerCase().includes(q)
      );
    }

    return filtered;
  },

  async getPortByCode(code) {
    try {
      const res = await apiClient.get(`ports/${code}`);
      if (res && res.data) {
        return {
          ...res.data,
          code: res.data.code || res.data.portCode,
          portCode: res.data.portCode || res.data.code,
        };
      }
    } catch {
      // fallback
    }
    const list = getStored(KEYS.PORTS);
    return list.find(item => item.code === code || item.id === code) || null;
  },

  async createPort(data, currentUser = "Super Admin") {
    const code = (data.code || data.portCode || 'PRT').toUpperCase().trim();
    let createdPort = null;
    try {
      const payload = {
        portCode: code,
        name: data.name || `${code} Commercial Port`,
        island: data.island || 'Island',
        country: data.country || 'Bahamas',
        defaultAgent: data.defaultAgent || 'Local Port Agency',
        status: data.status || 'Active',
      };
      const res = await apiClient.post('ports', payload);
      if (res && res.data) {
        createdPort = {
          ...res.data,
          code: res.data.code || res.data.portCode,
          portCode: res.data.portCode || res.data.code,
          defaultAgent: res.data.defaultAgent || data.defaultAgent || 'Local Port Agency'
        };
      }
    } catch (e) {
      console.warn('[portService] API create port failed, using local storage:', e.message);
    }

    const list = getStored(KEYS.PORTS);
    const id = createdPort?.id || data.id || `PORT-${code}`;

    const newPort = createdPort || {
      ...data,
      id,
      code,
      name: data.name || `${code} Commercial Port`,
      island: data.island || 'Island',
      country: data.country || 'Bahamas',
      status: data.status || 'Active',
      defaultAgent: data.defaultAgent || 'Local Port Agency'
    };

    const updated = [...list.filter(p => p.code !== newPort.code && p.id !== newPort.id), newPort];
    setStored(KEYS.PORTS, updated);

    await auditService.logAction(
      currentUser,
      "Port Management",
      "Added Island Port Destination",
      code,
      `Registered new port destination ${code} - ${newPort.name} (${newPort.island}, ${newPort.country}).`
    );

    return newPort;
  },

  async updatePort(id, updates, currentUser = "Super Admin") {
    let updatedPort = null;
    try {
      const payload = {
        name: updates.name,
        island: updates.island,
        country: updates.country,
        status: updates.status,
      };
      const res = await apiClient.patch(`ports/${id}`, payload);
      if (res && res.data) {
        updatedPort = {
          ...res.data,
          code: res.data.code || res.data.portCode,
          portCode: res.data.portCode || res.data.code,
        };
      }
    } catch (e) {
      console.warn('[portService] API update port failed, using local storage:', e.message);
    }

    const list = getStored(KEYS.PORTS);
    const index = list.findIndex(item => item.id === id || item.code === id);
    if (index !== -1) {
      list[index] = updatedPort || {
        ...list[index],
        ...updates
      };
      setStored(KEYS.PORTS, list);

      await auditService.logAction(
        currentUser,
        "Port Management",
        "Updated Island Port Destination",
        id,
        `Updated port destination details for ${list[index].code} - ${list[index].name}.`
      );

      return list[index];
    }
    return updatedPort;
  },

  async deletePort(id, currentUser = "Super Admin") {
    try {
      await apiClient.delete(`ports/${id}`);
    } catch (e) {
      console.warn('[portService] API delete port failed, using local storage:', e.message);
    }

    const list = getStored(KEYS.PORTS);
    const existing = list.find(item => item.id === id || item.code === id);
    if (!existing) return false;

    const filtered = list.filter(item => item.id !== id && item.code !== id);
    setStored(KEYS.PORTS, filtered);

    await auditService.logAction(
      currentUser,
      "Port Management",
      "Deleted Island Port Destination",
      id,
      `Deleted port destination ${existing.code} - ${existing.name}.`
    );

    return true;
  }
};
