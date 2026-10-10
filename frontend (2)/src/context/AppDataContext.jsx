import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getStored, setStored, KEYS, initializeStorage, clearTransactionalData } from '../services/storageService';
import { customerService } from '../services/customerService';
import { warehouseService } from '../services/warehouseService';
import { cargoService } from '../services/cargoService';
import { houseBillService } from '../services/houseBillService';
import { consolidationService } from '../services/consolidationService';
import { shipmentService } from '../services/shipmentService';
import { billOfLadingService } from '../services/billOfLadingService';
import { manifestService } from '../services/manifestService';
import { portService, containerService, vesselService, agentService, userService, documentService, settingsService } from '../services';

import { auditService } from '../services/auditService';
import { historyService } from '../services/historyService';
import { apiClient } from '../services/apiClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const AppDataContext = createContext(null);

export const AppDataProvider = ({ children }) => {
  const { currentUser, currentRole, syncUsers } = useAuth();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [warehouseReceipts, setWarehouseReceipts] = useState([]);
  const [cargoItems, setCargoItems] = useState([]);
  const [houseBills, setHouseBills] = useState([]);
  const [consolidations, setConsolidations] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [billsOfLading, setBillsOfLading] = useState([]);
  const [manifests, setManifests] = useState([]);
  const [containers, setContainers] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [voyages, setVoyages] = useState([]);
  const [agents, setAgents] = useState([]);
  const [ports, setPorts] = useState([]);
  const [users, setUsers] = useState([]);
  const [customDocuments, setCustomDocuments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historySummary, setHistorySummary] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState('dashboard');

  const customersRef = useRef(customers);
  const warehouseReceiptsRef = useRef(warehouseReceipts);
  const houseBillsRef = useRef(houseBills);
  useEffect(() => {
    customersRef.current = customers;
    warehouseReceiptsRef.current = warehouseReceipts;
    houseBillsRef.current = houseBills;
  }, [customers, warehouseReceipts, houseBills]);

  // Helper to extract list from diverse API response shapes
  const extractListFromRes = (res) => {
    if (!res) return null;
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    if (Array.isArray(res?.items)) return res.items;
    return null;
  };


  // ON-DEMAND API Fetcher: Triggers ONLY the API corresponding to the clicked menu
  const fetchMenuApi = useCallback(async (tabName) => {
    if (!tabName) return;
    setActiveMenuTab(tabName);

    try {
      switch (tabName) {
        case 'dashboard': {
          if (currentRole === 'warehouse') {
            await apiClient.get('/cfs-dashboard').catch(() => {});
          } else if (currentRole === 'operations') {
            await apiClient.get('/ops-dashboard').catch(() => {});
          } else if (currentRole === 'documentation') {
            await apiClient.get('/docs-dashboard').catch(() => {});
          } else if (currentRole === 'agent') {
            await apiClient.get('/agent-dashboard').catch(() => {});
          } else {
            await apiClient.get('/admin-dashboard').catch(() => {});
          }
          break;
        }

        case 'customers': {
          const custRes = await apiClient.get('/customers').catch(() => null);
          const list = extractListFromRes(custRes);
          if (list !== null) {
            setCustomers(list);
            setStored(KEYS.CUSTOMERS, list);
          }
          if (!warehouseReceiptsRef.current || warehouseReceiptsRef.current.length === 0) {
            apiClient.get('/warehouse-receipts').then(res => {
              const wList = extractListFromRes(res);
              if (wList) {
                setWarehouseReceipts(wList);
                setStored(KEYS.WAREHOUSE_RECEIPTS, wList);
              }
            }).catch(() => {});
          }
          if (!houseBillsRef.current || houseBillsRef.current.length === 0) {
            houseBillService.getHouseBills().then(hbList => {
              if (Array.isArray(hbList)) {
                setHouseBills(hbList);
                setStored(KEYS.HOUSE_BILLS, hbList);
              }
            }).catch(() => {});
          }
          break;
        }

        case 'warehouse-receipts': {
          const wrRes = await apiClient.get('/warehouse-receipts').catch(() => null);
          const list = extractListFromRes(wrRes);
          if (list !== null) {
            setWarehouseReceipts(list);
            setStored(KEYS.WAREHOUSE_RECEIPTS, list);
          }
          await apiClient.get('/labels').catch(() => { });
          if (!customersRef.current || customersRef.current.length === 0) {
            apiClient.get('/customers').then(res => {
              const cList = extractListFromRes(res);
              if (cList) {
                setCustomers(cList);
                setStored(KEYS.CUSTOMERS, cList);
              }
            }).catch(() => {});
          }
          break;
        }

        case 'cargo': {
          const cargoRes = await apiClient.get('/cargo').catch(() => null);
          const list = extractListFromRes(cargoRes);
          if (list !== null) {
            setCargoItems(list);
            setStored(KEYS.CARGO, list);
          }
          if (!customersRef.current || customersRef.current.length === 0) {
            apiClient.get('/customers').then(res => {
              const cList = extractListFromRes(res);
              if (cList) {
                setCustomers(cList);
                setStored(KEYS.CUSTOMERS, cList);
              }
            }).catch(() => {});
          }
          break;
        }

        case 'house-bills': {
          const hbData = await houseBillService.getHouseBills();
          if (Array.isArray(hbData)) {
            setHouseBills(hbData);
            setStored(KEYS.HOUSE_BILLS, hbData);
          }
          break;
        }

        case 'consolidations': {
          const consRes = await apiClient.get('/consolidations').catch(() => null);
          const list = extractListFromRes(consRes);
          if (list !== null) {
            setConsolidations(list);
            setStored(KEYS.CONSOLIDATIONS, list);
          }
          break;
        }

        case 'shipments': {
          const shpRes = await apiClient.get('/shipments').catch(() => null);
          const list = extractListFromRes(shpRes);
          if (list !== null) {
            setShipments(list);
            setStored(KEYS.SHIPMENTS, list);
          }
          break;
        }

        case 'bills-of-lading': {
          const blRes = await apiClient.get('/bills-of-lading').catch(() => null);
          const list = extractListFromRes(blRes);
          if (list !== null) {
            setBillsOfLading(list);
            setStored(KEYS.BILLS_OF_LADING, list);
          }
          break;
        }

        case 'manifests': {
          const mnfRes = await apiClient.get('/manifests').catch(() => null);
          const list = extractListFromRes(mnfRes);
          if (list !== null) {
            setManifests(list);
            setStored(KEYS.MANIFESTS, list);
          }
          break;
        }

        case 'containers': {
          const cntRes = await apiClient.get('/containers').catch(() => null);
          const list = extractListFromRes(cntRes);
          if (list !== null) {
            setContainers(list);
            setStored(KEYS.CONTAINERS, list);
          }
          break;
        }

        case 'vessels': {
          const vslList = await vesselService.getVessels();
          const voyList = await vesselService.getVoyages();
          if (Array.isArray(vslList)) {
            setVessels(vslList);
            setStored(KEYS.VESSELS, vslList);
          }
          if (Array.isArray(voyList)) {
            setVoyages(voyList);
            setStored(KEYS.VOYAGES, voyList);
          }
          break;
        }

        case 'tracking': {
          const [shpRes, wrRes] = await Promise.all([
            apiClient.get('/shipments').catch(() => null),
            apiClient.get('/warehouse-receipts').catch(() => null)
          ]);
          const shpList = extractListFromRes(shpRes);
          const wrList = extractListFromRes(wrRes);
          if (shpList !== null) {
            setShipments(shpList);
            setStored(KEYS.SHIPMENTS, shpList);
          }
          if (wrList !== null) {
            setWarehouseReceipts(wrList);
            setStored(KEYS.WAREHOUSE_RECEIPTS, wrList);
          }
          break;
        }

        case 'documents': {
          const docRes = await apiClient.get('/documents').catch(() => null);
          const list = extractListFromRes(docRes);
          if (list !== null) {
            setCustomDocuments(list);
            setStored(KEYS.DOCUMENTS, list);
          }
          break;
        }

        case 'agents': {
          const agtRes = await apiClient.get('/agents').catch(() => null);
          const list = extractListFromRes(agtRes);
          if (list !== null) {
            setAgents(list);
            setStored(KEYS.AGENTS, list);
          }
          break;
        }

        case 'users': {
          const usrRes = await apiClient.get('/users');
          const rawUsers = Array.isArray(usrRes) ? usrRes : (usrRes?.data || []);
          if (Array.isArray(rawUsers) && rawUsers.length > 0) {
            setUsers(rawUsers);
            setStored(KEYS.USERS, rawUsers);
          }
          break;
        }

        case 'audit': {
          const audRes = await apiClient.get('/audit').catch(() => null);
          const list = extractListFromRes(audRes);
          if (list !== null) {
            setAuditLogs(list);
            setStored(KEYS.AUDIT_LOGS, list);
          }
          break;
        }

        case 'settings': {
          const setRes = await apiClient.get('/settings').catch(() => null);
          const val = setRes?.data || setRes;
          if (val) {
            setSettings(val);
            setStored(KEYS.SETTINGS, val);
          }
          break;
        }

        case 'ports': {
          const pRes = await apiClient.get('/ports').catch(() => null);
          const raw = extractListFromRes(pRes);
          if (raw !== null) {
            const mapped = raw.map(p => ({
              ...p,
              code: p.code || p.portCode,
              portCode: p.portCode || p.code,
            }));
            setPorts(mapped);
            setStored(KEYS.PORTS, mapped);
          }
          break;
        }

        case 'history': {
          setHistoryLoading(true);
          const histRes = await historyService.getShipmentHistory().catch(() => null);
          if (histRes && histRes.data) {
            setHistoryData(histRes.data);
            setHistorySummary(histRes.summary);
          }
          setHistoryLoading(false);
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.warn(`Menu API call for ${tabName} notice:`, err.message);
    }
  }, [currentRole]);

  // On-Demand Refresh: Only initializes storage, checks health, master configs, and fetches the active/targeted menu tab
  const refreshAll = useCallback(async (targetTab) => {
    initializeStorage();
    setIsLoading(false);

    try {
      const isLive = await apiClient.checkHealth();
      setIsBackendConnected(isLive);
      if (!isLive || !apiClient.getToken()) {
        return;
      }

      // 1. Ensure master metadata (settings & ports) is loaded if not yet populated
      if (!settings || Object.keys(settings).length === 0) {
        apiClient.get('/settings').then(res => {
          if (res?.data) {
            setSettings(res.data);
            setStored(KEYS.SETTINGS, res.data);
          }
        }).catch(() => {});
      }

      if (!ports || ports.length === 0) {
        apiClient.get('/ports').then(res => {
          const raw = extractListFromRes(res);
          if (raw) {
            const mapped = raw.map(p => ({
              ...p,
              code: p.code || p.portCode,
              portCode: p.portCode || p.code,
            }));
            setPorts(mapped);
            setStored(KEYS.PORTS, mapped);
          }
        }).catch(() => {});
      }

      // 2. Fetch data only for the active or requested menu tab
      let tabToFetch = targetTab;
      if (!tabToFetch && typeof window !== 'undefined') {
        const path = window.location.pathname.replace(/^\//, '').split('/')[0];
        tabToFetch = path || activeMenuTab || 'dashboard';
      }

      if (tabToFetch && tabToFetch !== 'all') {
        await fetchMenuApi(tabToFetch);
      }
    } catch (e) {
      console.warn('Backend live sync notice:', e.message);
      setIsBackendConnected(false);
    }
  }, [fetchMenuApi, activeMenuTab, settings, ports]);

  useEffect(() => {
    if (apiClient.getToken()) {
      refreshAll();
    }
  }, []);

  // 1. Customers CRUD
  const createCustomer = async (customerData) => {
    const created = await customerService.createCustomer(customerData, currentUser?.name || "Warehouse Staff");
    await fetchMenuApi('customers');
    showToast(`Customer Profile ${created.customerNumber || created.name} created successfully.`, 'success', 'Customer Created');
    return created;
  };

  const updateCustomer = async (id, updates) => {
    const updated = await customerService.updateCustomer(id, updates, currentUser?.name || "Warehouse Staff");
    await fetchMenuApi('customers');
    showToast(`Customer Profile ${id} updated successfully.`, 'success', 'Customer Updated');
    return updated;
  };

  const deleteCustomer = async (id) => {
    setCustomers(prev => prev.filter(c => c.id !== id && c.customerNumber !== id && c.accountNumber !== id));
    const success = await customerService.deleteCustomer(id, currentUser?.name || "Super Admin");
    if (success) {
      await fetchMenuApi('customers');
      showToast(`Customer Profile ${id} deleted successfully.`, 'info', 'Customer Deleted');
    }
    return success;
  };

  // 2. Warehouse Receipts CRUD
  const createWarehouseReceipt = async (receiptData) => {
    let created;
    try {
      const res = await apiClient.post('/warehouse-receipts', receiptData);
      if (res?.data) created = res.data;
    } catch (e) {
      console.warn('Backend createWarehouseReceipt notice:', e.message);
    }
    if (!created) {
      created = await warehouseService.createReceipt(receiptData, currentUser?.name || "Warehouse Staff");
    }
    await fetchMenuApi('warehouse-receipts');
    showToast(`Warehouse Receipt ${created.receiptNumber || created.id} intaked.`, 'success', 'Receipt Created');
    return created;
  };

  const updateWarehouseReceipt = async (id, updates) => {
    const updated = await warehouseService.updateReceipt(id, updates, currentUser?.name || "Warehouse Staff");
    await fetchMenuApi('warehouse-receipts');
    showToast(`Warehouse Receipt ${id} updated successfully.`, 'success', 'Receipt Updated');
    return updated;
  };

  const deleteWarehouseReceipt = async (id) => {
    setWarehouseReceipts(prev => prev.filter(r => r.id !== id && r.receiptNumber !== id));
    const success = await warehouseService.deleteReceipt(id, currentUser?.name || "Warehouse Staff");
    if (success) {
      await fetchMenuApi('warehouse-receipts');
      showToast(`Warehouse Receipt ${id} deleted successfully.`, 'info', 'Receipt Deleted');
    }
    return success;
  };

  // 3. Cargo Inventory CRUD
  const createCargo = async (cargoData) => {
    const created = await cargoService.createCargo(cargoData, currentUser?.name || "Warehouse Staff");
    await fetchMenuApi('cargo');
    showToast(`Cargo Unit ${created.id} registered into warehouse inventory.`, 'success', 'Cargo Intaked');
    return created;
  };

  const updateCargo = async (id, updates) => {
    const updated = await cargoService.updateCargo(id, updates, currentUser?.name || "Warehouse Staff");
    await fetchMenuApi('cargo');
    showToast(`Cargo Unit ${id} updated successfully.`, 'success', 'Cargo Updated');
    return updated;
  };

  const deleteCargo = async (id) => {
    setCargoItems(prev => prev.filter(c => c.id !== id && c.cargoNumber !== id));
    const success = await cargoService.deleteCargo(id, currentUser?.name || "Warehouse Staff");
    if (success) {
      await fetchMenuApi('cargo');
      showToast(`Cargo Unit ${id} deleted from inventory.`, 'info', 'Cargo Deleted');
    }
    return success;
  };

  // 4. House Bills of Lading CRUD
  const createHouseBill = async (hblData) => {
    const created = await houseBillService.createHouseBill(hblData, currentUser?.name || "Documentation Staff");
    if (created) {
      setHouseBills(prev => [created, ...prev.filter(h => h.id !== created.id && h.hblNumber !== created.hblNumber)]);
    }
    await fetchMenuApi('house-bills');
    showToast(`House B/L ${created.hblNumber || created.id} issued for ${created.customerName || 'Customer'}.`, 'success', 'House B/L Created');
    return created;
  };

  const updateHouseBill = async (id, updates) => {
    const updated = await houseBillService.updateHouseBill(id, updates, currentUser?.name || "Documentation Staff");
    await fetchMenuApi('house-bills');
    showToast(`House B/L ${updated?.hblNumber || id} updated successfully.`, 'success', 'House B/L Updated');
    return updated;
  };

  const deleteHouseBill = async (id) => {
    setHouseBills(prev => prev.filter(h => h.id !== id && h.hblNumber !== id));
    const success = await houseBillService.deleteHouseBill(id, currentUser?.name || "Documentation Staff");
    if (success) {
      await fetchMenuApi('house-bills');
      showToast(`House B/L ${id} deleted.`, 'info', 'House B/L Deleted');
    }
    return success;
  };

  const placeHBLHold = async (hblId, reason, notes) => {
    const updated = await houseBillService.placeHold(hblId, reason, notes, currentUser?.name || "Documentation Staff");
    if (updated) {
      setHouseBills(prev => prev.map(h => (h.id === hblId || h.hblNumber === hblId ? updated : h)));
    }
    await fetchMenuApi('house-bills');
    showToast(`House B/L ${hblId} placed ON HOLD.`, 'warning', 'House B/L On Hold');
    return updated;
  };

  const clearHBLHold = async (hblId, clearNotes) => {
    const updated = await houseBillService.clearHold(hblId, currentUser?.name || "Documentation Staff", clearNotes);
    if (updated) {
      setHouseBills(prev => prev.map(h => (h.id === hblId || h.hblNumber === hblId ? updated : h)));
    }
    await fetchMenuApi('house-bills');
    showToast(`Hold cleared for House B/L ${hblId}.`, 'success', 'House B/L Released');
    return updated;
  };

  const updateHBLStatus = async (hblId, status) => {
    const updated = await houseBillService.updateStatus(hblId, status, currentUser?.name || "Documentation Staff");
    if (updated) {
      setHouseBills(prev => prev.map(h => (h.id === hblId || h.hblNumber === hblId ? updated : h)));
    }
    await fetchMenuApi('house-bills');
    showToast(`House B/L ${hblId} status updated to ${status}.`, 'info', 'Status Updated');
    return updated;
  };

  // 5. Consolidations CRUD
  const createConsolidation = async (consolidationData) => {
    let created;
    try {
      const res = await apiClient.post('/consolidations', consolidationData);
      if (res?.data) created = res.data;
    } catch (e) {
      console.warn('Backend createConsolidation notice:', e.message);
    }
    if (!created) {
      created = await consolidationService.createConsolidation(consolidationData, currentUser?.name || "Operations Staff");
    }
    await fetchMenuApi('consolidations');
    showToast(`Consolidation ${created.consolidationNumber || created.id} created successfully.`, 'success', 'Consolidation Ready');
    return created;
  };

  const updateConsolidation = async (id, updates) => {
    const updated = await consolidationService.updateConsolidation(id, updates, currentUser?.name || "Operations Staff");
    await fetchMenuApi('consolidations');
    showToast(`Consolidation ${id} updated successfully.`, 'success', 'Consolidation Updated');
    return updated;
  };

  const deleteConsolidation = async (id) => {
    setConsolidations(prev => prev.filter(c => c.id !== id && c.consolidationNumber !== id));
    const success = await consolidationService.deleteConsolidation(id, currentUser?.name || "Operations Staff");
    if (success) {
      await fetchMenuApi('consolidations');
      showToast(`Consolidation ${id} deleted.`, 'info', 'Consolidation Deleted');
    }
    return success;
  };

  // 6. Shipments CRUD
  const createShipment = async (shipmentData) => {
    let created;
    try {
      const res = await apiClient.post('/shipments', shipmentData);
      if (res?.data) created = res.data;
    } catch (e) {
      console.warn('Backend createShipment notice:', e.message);
    }
    if (!created) {
      created = await shipmentService.createShipment(shipmentData, currentUser?.name || "Operations Staff");
    }
    await fetchMenuApi('shipments');
    showToast(`Shipment ${created.shipmentNumber || created.id} created successfully.`, 'success', 'Shipment Created');
    return created;
  };

  const updateShipment = async (id, updates) => {
    try {
      const updated = await shipmentService.updateShipment(id, updates, currentUser?.name || "Super Admin");
      await fetchMenuApi('shipments');
      showToast(`Shipment ${updated?.shipmentNumber || id} updated successfully.`, 'success', 'Shipment Updated');
      return updated;
    } catch (err) {
      showToast(err?.message || 'Failed to update shipment', 'error', 'Update Error');
      throw err;
    }
  };

  const deleteShipment = async (id) => {
    try {
      setShipments(prev => prev.filter(s => s.id !== id && s.shipmentNumber !== id));
      const success = await shipmentService.deleteShipment(id, currentUser?.name || "Super Admin");
      if (success) {
        await fetchMenuApi('shipments');
        showToast(`Shipment ${id} deleted successfully.`, 'info', 'Shipment Deleted');
      }
      return success;
    } catch (err) {
      showToast(err?.message || 'Failed to delete shipment', 'error', 'Delete Error');
      throw err;
    }
  };

  // 7. Bills of Lading CRUD (Master B/L)
  const createBillOfLading = async (blData) => {
    try {
      const created = await billOfLadingService.createBillOfLading(blData, currentUser?.name || "Documentation Staff");
      await fetchMenuApi('bills-of-lading');
      showToast(`Master B/L ${created?.blNumber || created?.id} created successfully.`, 'success', 'Master B/L Created');
      return created;
    } catch (err) {
      showToast(err?.message || 'Failed to create Master B/L', 'error', 'Creation Failed');
      throw err;
    }
  };

  const updateBillOfLading = async (id, updates) => {
    const updated = await billOfLadingService.updateBillOfLading(id, updates, currentUser?.name || "Documentation Staff");
    await fetchMenuApi('bills-of-lading');
    showToast(`Master B/L ${id} updated successfully.`, 'success', 'Master B/L Updated');
    return updated;
  };

  const deleteBillOfLading = async (id) => {
    setBillsOfLading(prev => prev.filter(b => b.id !== id && b.blNumber !== id));
    const success = await billOfLadingService.deleteBillOfLading(id, currentUser?.name || "Documentation Staff");
    if (success) {
      await fetchMenuApi('bills-of-lading');
      showToast(`Master B/L ${id} deleted.`, 'info', 'Master B/L Deleted');
    }
    return success;
  };

  const placeBLHold = async (blId, reason, notes) => {
    const updated = await billOfLadingService.placeHold(blId, reason, notes, currentUser?.name || "Operations Staff");
    await fetchMenuApi('bills-of-lading');
    showToast(`Master B/L ${blId} has been placed ON HOLD. Document access restricted.`, 'warning', 'B/L Placed On Hold');
    return updated;
  };

  const clearBLHold = async (blId, clearNotes) => {
    const updated = await billOfLadingService.clearHold(blId, currentUser?.name || "Operations Staff", clearNotes);
    await fetchMenuApi('bills-of-lading');
    showToast(`Hold cleared for Master B/L ${blId}. Status is now RELEASED.`, 'success', 'B/L Released');
    return updated;
  };

  const updateBLStatus = async (blId, status) => {
    const updated = await billOfLadingService.updateStatus(blId, status, currentUser?.name || "Documentation Staff");
    await fetchMenuApi('bills-of-lading');
    showToast(`Master B/L ${blId} status updated to ${status}.`, 'info', 'Status Updated');
    return updated;
  };

  // 8. Manifests CRUD
  const generateManifest = async (manifestData) => {
    try {
      const created = await manifestService.generateManifest(manifestData, currentUser?.name || "Documentation Staff");
      await fetchMenuApi('manifests');
      showToast(`Shipping Manifest ${created.manifestNumber || created.id} generated successfully.`, 'success', 'Manifest Created');
      return created;
    } catch (err) {
      showToast(err?.message || 'Failed to generate manifest', 'error', 'Creation Error');
      throw err;
    }
  };

  const updateManifest = async (id, updates) => {
    const updated = await manifestService.updateManifest(id, updates, currentUser?.name || "Documentation Staff");
    await fetchMenuApi('manifests');
    showToast(`Shipping Manifest ${id} updated successfully.`, 'success', 'Manifest Updated');
    return updated;
  };

  const deleteManifest = async (id) => {
    setManifests(prev => prev.filter(m => m.id !== id && m.manifestNumber !== id));
    const success = await manifestService.deleteManifest(id, currentUser?.name || "Documentation Staff");
    if (success) {
      await fetchMenuApi('manifests');
      showToast(`Shipping Manifest ${id} deleted.`, 'info', 'Manifest Deleted');
    }
    return success;
  };

  // 9. Vessels & Voyages CRUD
  const createVessel = async (vesselData) => {
    try {
      const created = await vesselService.createVessel(vesselData, currentUser?.name || "Operations Staff");
      await fetchMenuApi('vessels');
      showToast(`Vessel ${created.name} added to fleet directory.`, 'success', 'Vessel Registered');
      return created;
    } catch (err) {
      showToast(err?.message || 'Failed to create vessel', 'error', 'Creation Error');
      throw err;
    }
  };

  const updateVessel = async (id, updates) => {
    try {
      const updated = await vesselService.updateVessel(id, updates, currentUser?.name || "Operations Staff");
      await fetchMenuApi('vessels');
      showToast(`Vessel ${id} updated successfully.`, 'success', 'Vessel Updated');
      return updated;
    } catch (err) {
      showToast(err?.message || 'Failed to update vessel', 'error', 'Update Error');
      throw err;
    }
  };

  const deleteVessel = async (id) => {
    try {
      setVessels(prev => prev.filter(v => v.id !== id && v.name !== id));
      const success = await vesselService.deleteVessel(id, currentUser?.name || "Operations Staff");
      if (success) {
        await fetchMenuApi('vessels');
        showToast(`Vessel ${id} deleted from fleet.`, 'info', 'Vessel Removed');
      }
      return success;
    } catch (err) {
      showToast(err?.message || 'Failed to delete vessel', 'error', 'Delete Error');
      throw err;
    }
  };

  const createVoyage = async (voyageData) => {
    try {
      const created = await vesselService.createVoyage(voyageData, currentUser?.name || "Operations Staff");
      await fetchMenuApi('vessels');
      showToast(`Voyage ${created.voyageNumber} scheduled successfully.`, 'success', 'Voyage Scheduled');
      return created;
    } catch (err) {
      showToast(err?.message || 'Failed to schedule voyage', 'error', 'Schedule Error');
      throw err;
    }
  };

  const updateVoyage = async (id, updates) => {
    try {
      const updated = await vesselService.updateVoyage(id, updates, currentUser?.name || "Operations Staff");
      await fetchMenuApi('vessels');
      showToast(`Voyage ${id} updated successfully.`, 'success', 'Voyage Updated');
      return updated;
    } catch (err) {
      showToast(err?.message || 'Failed to update voyage', 'error', 'Update Error');
      throw err;
    }
  };

  const deleteVoyage = async (id) => {
    try {
      setVoyages(prev => prev.filter(v => v.id !== id && v.voyageNumber !== id));
      const success = await vesselService.deleteVoyage(id, currentUser?.name || "Operations Staff");
      if (success) {
        await fetchMenuApi('vessels');
        showToast(`Voyage ${id} deleted.`, 'info', 'Voyage Deleted');
      }
      return success;
    } catch (err) {
      showToast(err?.message || 'Failed to delete voyage', 'error', 'Delete Error');
      throw err;
    }
  };

  // 10. Containers CRUD
  const createContainer = async (containerData) => {
    const created = await containerService.createContainer(containerData, currentUser?.name || "Operations Staff");
    await fetchMenuApi('containers');
    showToast(`Container ${created.containerNumber} registered into equipment fleet.`, 'success', 'Container Added');
    return created;
  };

  const updateContainer = async (id, updates) => {
    const updated = await containerService.updateContainer(id, updates, currentUser?.name || "Operations Staff");
    await fetchMenuApi('containers');
    showToast(`Container ${id} updated successfully.`, 'success', 'Container Updated');
    return updated;
  };

  const deleteContainer = async (id) => {
    setContainers(prev => prev.filter(c => c.id !== id && c.containerNumber !== id));
    const success = await containerService.deleteContainer(id, currentUser?.name || "Operations Staff");
    if (success) {
      await fetchMenuApi('containers');
      showToast(`Container ${id} deleted.`, 'info', 'Container Removed');
    }
    return success;
  };

  // 11. Agents CRUD
  const createAgent = async (agentData) => {
    let created;
    try {
      const res = await apiClient.post('/agents', agentData);
      if (res?.data) created = res.data;
    } catch (e) {
      console.warn('Backend createAgent notice:', e.message);
    }
    if (!created) {
      created = await agentService.createAgent(agentData, currentUser?.name || "Operations Staff");
    }
    await fetchMenuApi('agents');
    showToast(`Port Agent ${created.name || created.code} registered.`, 'success', 'Agent Created');
    return created;
  };

  const updateAgent = async (id, updates) => {
    const updated = await agentService.updateAgent(id, updates, currentUser?.name || "Operations Staff");
    await fetchMenuApi('agents');
    showToast(`Port Agent ${id} updated successfully.`, 'success', 'Agent Updated');
    return updated;
  };

  const deleteAgent = async (id) => {
    setAgents(prev => prev.filter(a => a.id !== id && a.agentCode !== id));
    const success = await agentService.deleteAgent(id, currentUser?.name || "Operations Staff");
    if (success) {
      await fetchMenuApi('agents');
      showToast(`Port Agent ${id} deleted.`, 'info', 'Agent Removed');
    }
    return success;
  };

  // 12. Users CRUD
  const createUser = async (userData) => {
    const created = await userService.createUser(userData, currentUser?.name || "Super Admin");
    if (syncUsers) await syncUsers();
    showToast(`Staff Account for ${created?.name || 'user'} created.`, 'success', 'User Registered');
    return created;
  };

  const updateUser = async (id, updates) => {
    const updated = await userService.updateUser(id, updates, currentUser?.name || "Super Admin");
    if (syncUsers) await syncUsers();
    showToast(`Staff Account for ${updated?.name || id} updated.`, 'success', 'User Updated');
    return updated;
  };

  const deleteUser = async (id) => {
    setUsers(prev => prev.filter(u => u.id !== id && u.email !== id));
    const success = await userService.deleteUser(id, currentUser?.name || "Super Admin");
    if (success) {
      if (syncUsers) await syncUsers();
      showToast(`Staff Account ${id} deleted.`, 'info', 'User Deleted');
    }
    return success;
  };

  // 13. Documents CRUD
  const uploadDocument = async (docData) => {
    const created = await documentService.uploadDocument(docData, currentUser?.name || "Documentation Staff");
    await fetchMenuApi('documents');
    showToast(`Document ${created.title} uploaded successfully.`, 'success', 'Document Attached');
    return created;
  };

  const deleteDocument = async (id) => {
    setCustomDocuments(prev => prev.filter(d => d.id !== id));
    const success = await documentService.deleteDocument(id, currentUser?.name || "Documentation Staff");
    if (success) {
      await fetchMenuApi('documents');
      showToast(`Document ${id} removed.`, 'info', 'Document Deleted');
    }
    return success;
  };

  // 14. Ports & Island Destinations CRUD
  const createPort = async (portData) => {
    const created = await portService.createPort(portData, currentUser?.name || "Super Admin");
    await fetchMenuApi('ports');
    showToast(`Island Port Destination ${created.code || created.portCode} (${created.name}) registered.`, 'success', 'Port Added');
    return created;
  };

  const updatePort = async (id, updates) => {
    const updated = await portService.updatePort(id, updates, currentUser?.name || "Super Admin");
    await fetchMenuApi('ports');
    showToast(`Island Port ${id} updated successfully.`, 'success', 'Port Updated');
    return updated;
  };

  const deletePort = async (id) => {
    setPorts(prev => prev.filter(p => p.id !== id && p.code !== id));
    const success = await portService.deletePort(id, currentUser?.name || "Super Admin");
    if (success) {
      await fetchMenuApi('ports');
      showToast(`Island Port ${id} removed.`, 'info', 'Port Deleted');
    }
    return success;
  };

  // Clear all transactional records
  const clearAllData = () => {
    clearTransactionalData();
    refreshAll();
    showToast(`All transactional records cleared! System is now a clean blank slate for testing.`, 'success', 'Data Cleared');
  };

  const updateSettings = async (newSettings) => {
    setStored(KEYS.SETTINGS, newSettings);
    setSettings(newSettings);
    await settingsService.updateAllSettings(newSettings);
    refreshAll();
    showToast(`System settings updated successfully.`, 'success', 'Settings Saved');
  };

  // Reset demo data to factory defaults
  const resetDemoData = () => {
    localStorage.clear();
    initializeStorage();
    refreshAll();
    showToast(`Demo datasets reset to factory defaults.`, 'info', 'System Reset');
  };

  return (
    <AppDataContext.Provider value={{
      customers,
      warehouseReceipts,
      cargoItems,
      houseBills,
      consolidations,
      shipments,
      billsOfLading,
      manifests,
      containers,
      vessels,
      voyages,
      agents,
      ports,
      users,
      customDocuments,
      auditLogs,
      settings,
      isLoading,
      refreshAll,
      fetchMenuApi,
      // Customers
      createCustomer,
      updateCustomer,
      deleteCustomer,
      // Warehouse Receipts
      createWarehouseReceipt,
      updateWarehouseReceipt,
      deleteWarehouseReceipt,
      // Cargo
      createCargo,
      updateCargo,
      deleteCargo,
      // House Bills of Lading (HBL)
      createHouseBill,
      updateHouseBill,
      deleteHouseBill,
      placeHBLHold,
      clearHBLHold,
      updateHBLStatus,
      // Consolidations
      createConsolidation,
      updateConsolidation,
      deleteConsolidation,
      // Shipments
      createShipment,
      updateShipment,
      deleteShipment,
      // Bills of Lading (Master B/L)
      createBillOfLading,
      updateBillOfLading,
      deleteBillOfLading,
      placeBLHold,
      clearBLHold,
      updateBLStatus,
      // Manifests
      generateManifest,
      createManifest: generateManifest,
      updateManifest,
      deleteManifest,
      // Vessels & Voyages
      createVessel,
      updateVessel,
      deleteVessel,
      createVoyage,
      updateVoyage,
      deleteVoyage,
      // Containers
      createContainer,
      updateContainer,
      deleteContainer,
      // Agents
      createAgent,
      updateAgent,
      deleteAgent,
      // Ports
      createPort,
      updatePort,
      deletePort,
      // Users
      createUser,
      updateUser,
      deleteUser,
      // Documents
      uploadDocument,
      deleteDocument,
      // Settings & reset
      updateSettings,
      clearAllData,
      resetDemoData,
      // Shipment History & Lifecycle Flow
      historyData,
      historySummary,
      historyLoading,
      fetchShipmentHistory: historyService.getShipmentHistory,
      // Live Backend State
      isBackendConnected,
      activeMenuTab,
      setActiveMenuTab,
      fetchMenuApi
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
