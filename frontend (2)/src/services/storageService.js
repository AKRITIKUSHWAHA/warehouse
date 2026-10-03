import { initialCustomers } from '../data/mock/customersData';
import { initialWarehouseReceipts } from '../data/mock/warehouseReceiptsData';
import { initialCargoItems } from '../data/mock/cargoData';
import { initialHouseBills } from '../data/mock/houseBillsData';
import { initialConsolidations } from '../data/mock/consolidationsData';
import { initialShipments } from '../data/mock/shipmentsData';
import { initialBillsOfLading } from '../data/mock/billsOfLadingData';
import { initialManifests } from '../data/mock/manifestsData';
import { initialContainers } from '../data/mock/containersData';
import { initialVessels, initialVoyages } from '../data/mock/vesselsData';
import { initialAgents } from '../data/mock/agentsData';
import { initialUsers, initialRolesPermissions } from '../data/mock/usersData';
import { initialAuditLogs } from '../data/mock/auditLogsData';
import { initialSettings } from '../data/mock/settingsData';
import { initialPorts } from '../data/mock/portsData';

const KEYS = {
  CUSTOMERS: 'kers_customers',
  WAREHOUSE_RECEIPTS: 'kers_warehouse_receipts',
  CARGO: 'kers_cargo_items',
  HOUSE_BILLS: 'kers_house_bills',
  CONSOLIDATIONS: 'kers_consolidations',
  SHIPMENTS: 'kers_shipments',
  BILLS_OF_LADING: 'kers_bills_of_lading',
  MANIFESTS: 'kers_manifests',
  CONTAINERS: 'kers_containers',
  VESSELS: 'kers_vessels',
  VOYAGES: 'kers_voyages',
  AGENTS: 'kers_agents',
  USERS: 'kers_users',
  ROLES: 'kers_roles',
  AUDIT_LOGS: 'kers_audit_logs',
  SETTINGS: 'kers_settings',
  DOCUMENTS: 'kers_documents',
  PORTS: 'kers_ports'
};

// Initialize localStorage with mock seed data if empty
export const initializeStorage = () => {
  const CLEAN_SLATE_KEY = 'kers_clean_slate_v6';
  if (!localStorage.getItem(CLEAN_SLATE_KEY)) {
    // Clear all transactional collections so UI strictly mirrors live database
    localStorage.setItem(KEYS.CONTAINERS, JSON.stringify([]));
    localStorage.setItem(KEYS.VESSELS, JSON.stringify([]));
    localStorage.setItem(KEYS.VOYAGES, JSON.stringify([]));
    localStorage.setItem(KEYS.SHIPMENTS, JSON.stringify([]));
    localStorage.setItem(KEYS.CARGO, JSON.stringify([]));
    localStorage.setItem(KEYS.CONSOLIDATIONS, JSON.stringify([]));
    localStorage.setItem(KEYS.BILLS_OF_LADING, JSON.stringify([]));
    localStorage.setItem(KEYS.HOUSE_BILLS, JSON.stringify([]));
    localStorage.setItem(KEYS.WAREHOUSE_RECEIPTS, JSON.stringify([]));
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));
    localStorage.setItem(KEYS.MANIFESTS, JSON.stringify([]));
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify([]));

    // Master configuration
    localStorage.setItem(KEYS.USERS, JSON.stringify(initialUsers));
    localStorage.setItem(KEYS.ROLES, JSON.stringify(initialRolesPermissions));
    localStorage.setItem(KEYS.AGENTS, JSON.stringify(initialAgents));
    localStorage.setItem(KEYS.PORTS, JSON.stringify(initialPorts));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(initialSettings));
    localStorage.setItem(CLEAN_SLATE_KEY, 'true');
  }

  if (!localStorage.getItem(KEYS.CUSTOMERS)) {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.WAREHOUSE_RECEIPTS)) {
    localStorage.setItem(KEYS.WAREHOUSE_RECEIPTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.CARGO)) {
    localStorage.setItem(KEYS.CARGO, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.HOUSE_BILLS)) {
    localStorage.setItem(KEYS.HOUSE_BILLS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.CONSOLIDATIONS)) {
    localStorage.setItem(KEYS.CONSOLIDATIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.SHIPMENTS)) {
    localStorage.setItem(KEYS.SHIPMENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.BILLS_OF_LADING)) {
    localStorage.setItem(KEYS.BILLS_OF_LADING, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.MANIFESTS)) {
    localStorage.setItem(KEYS.MANIFESTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.DOCUMENTS)) {
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.CONTAINERS)) {
    localStorage.setItem(KEYS.CONTAINERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.VESSELS)) {
    localStorage.setItem(KEYS.VESSELS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.VOYAGES)) {
    localStorage.setItem(KEYS.VOYAGES, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.AGENTS)) {
    localStorage.setItem(KEYS.AGENTS, JSON.stringify(initialAgents));
  }
  if (!localStorage.getItem(KEYS.USERS)) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(initialUsers));
  }
  if (!localStorage.getItem(KEYS.ROLES)) {
    localStorage.setItem(KEYS.ROLES, JSON.stringify(initialRolesPermissions));
  }
  if (!localStorage.getItem(KEYS.AUDIT_LOGS)) {
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(initialAuditLogs));
  }
  if (!localStorage.getItem(KEYS.SETTINGS)) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(initialSettings));
  }
  if (!localStorage.getItem(KEYS.PORTS)) {
    localStorage.setItem(KEYS.PORTS, JSON.stringify(initialPorts));
  }
};

export const getStored = (key, fallback = []) => {
  try {
    initializeStorage();
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    console.error(`Error reading key ${key} from storage:`, e);
    return fallback;
  }
};

export const setStored = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error writing key ${key} to storage:`, e);
  }
};

// Clear transactional data (Warehouse Receipts, Cargo, House Bills, Consolidations, Shipments, Bills of Lading, Manifests)
// for clean slate testing, while keeping master entities (Ports, Agents, Users, Settings)
export const clearTransactionalData = () => {
  setStored(KEYS.CUSTOMERS, []);
  setStored(KEYS.WAREHOUSE_RECEIPTS, []);
  setStored(KEYS.CARGO, []);
  setStored(KEYS.HOUSE_BILLS, []);
  setStored(KEYS.CONSOLIDATIONS, []);
  setStored(KEYS.SHIPMENTS, []);
  setStored(KEYS.BILLS_OF_LADING, []);
  setStored(KEYS.MANIFESTS, []);
  setStored(KEYS.DOCUMENTS, []);
  setStored(KEYS.CONTAINERS, []);
  setStored(KEYS.VESSELS, []);
  setStored(KEYS.VOYAGES, []);
  setStored(KEYS.AUDIT_LOGS, []);
  setStored(KEYS.AGENTS, initialAgents);
  setStored(KEYS.PORTS, initialPorts);
};

export { KEYS };

