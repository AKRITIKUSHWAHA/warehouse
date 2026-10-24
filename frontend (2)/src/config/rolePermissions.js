/**
 * Dynamic Single Source of Truth for Role-Based Access Control (RBAC) & Menu Visibility
 * Allows Super Admin to dynamically configure menu visibility and module access per role.
 */

export const STORAGE_KEY_ROLE_PERMISSIONS = 'kers_role_permissions_map_v6';

export const SYSTEM_MODULES = [
  // 1. CARGO & INTAKE
  {
    id: 'dashboard',
    label: 'Overview Dashboard',
    category: 'Cargo & Intake',
    description: 'Operational summary metrics, quick actions, and throughput charts',
    icon: 'LayoutDashboard',
    tabs: ['dashboard', 'agent-dashboard']
  },
  {
    id: 'customers',
    label: 'Customers Directory',
    category: 'Cargo & Intake',
    description: 'Master customer directory (shippers & consignees), contact details and destination ports',
    icon: 'Users',
    tabs: ['customers']
  },
  {
    id: 'warehouse-receipts',
    label: 'Warehouse Receipts (WR)',
    category: 'Cargo & Intake',
    description: 'Cargo intake, dimension calculations, barcode generation, intake receipts',
    icon: 'Package',
    tabs: ['warehouse-receipts']
  },
  {
    id: 'documents',
    label: 'Labels & Documents Center',
    category: 'Cargo & Intake',
    description: '4x6 thermal barcode labels, print layouts, uploaded paperwork',
    icon: 'Tag',
    tabs: ['documents', 'agent-documents']
  },

  // 2. LOGISTICS & OCEAN FREIGHT
  {
    id: 'house-bills',
    label: 'House Bills of Lading (HBL)',
    category: 'Logistics & Ocean',
    description: 'Generate, edit, print House B/Ls, attach freight charges & terms',
    icon: 'FileText',
    tabs: ['house-bills']
  },
  {
    id: 'consolidations',
    label: 'Container Consolidation',
    category: 'Logistics & Ocean',
    description: 'Multi-order container stuffing, CBM load balancing, sealing & arrivals',
    icon: 'Layers',
    tabs: ['consolidations']
  },
  {
    id: 'shipments',
    label: 'Ocean Shipments',
    category: 'Logistics & Ocean',
    description: 'Ocean freight shipments, container tracking, port-to-port manifests',
    icon: 'Ship',
    tabs: ['shipments', 'agent-shipments']
  },
  {
    id: 'bills-of-lading',
    label: 'Master Bills & Manifests',
    category: 'Logistics & Ocean',
    description: 'Carrier master B/Ls, 1-click manifest generation, discharge clearance',
    icon: 'FileSpreadsheet',
    tabs: ['bills-of-lading', 'manifests', 'agent-bl-detail']
  },
  {
    id: 'vessels',
    label: 'Fleet Directory',
    category: 'Logistics & Ocean',
    description: 'Serviced vessel fleet directory, vessel specs and carrier details',
    icon: 'Anchor',
    tabs: ['vessels']
  },
  {
    id: 'tracking',
    label: 'Cargo Tracking Portal',
    category: 'Logistics & Ocean',
    description: 'Live milestone timeline, public search, agent tracking',
    icon: 'Search',
    tabs: ['tracking', 'agent-tracking']
  },

  // 3. SYSTEM & GOVERNANCE
  {
    id: 'history',
    label: 'Shipment History',
    category: 'System & Governance',
    description: 'Historical shipment logs, delivered cargo lookup, archive records',
    icon: 'History',
    tabs: ['history']
  },
  {
    id: 'audit',
    label: 'Activity Logs / Audit Trail',
    category: 'System & Governance',
    description: 'Immutable transaction logs, IP recording, change history inspection',
    icon: 'Activity',
    tabs: ['audit']
  },
  {
    id: 'users',
    label: 'Users & Roles Matrix',
    category: 'System & Governance',
    description: 'Manage staff accounts, credentials, role permissions & menu visibility matrix',
    icon: 'ShieldCheck',
    tabs: ['users']
  },
  {
    id: 'settings',
    label: 'System Settings & Config',
    category: 'System & Governance',
    description: 'Global numbering rules, company profiles, currency & fee defaults',
    icon: 'Settings',
    tabs: ['settings']
  },

  // 4. SPECIAL OPERATIONAL PERMISSION
  {
    id: 'hold-authorization',
    label: 'Place / Clear B/L Hold',
    category: 'Operational Authorization',
    description: 'Administrative hold override, financial lock releases, compliance authority',
    icon: 'Shield',
    tabs: []
  }
];

export const DEFAULT_ROLE_PERMISSIONS_MAP = {
  super_admin: [
    'dashboard', 'customers', 'warehouse-receipts', 'documents',
    'house-bills', 'consolidations', 'shipments', 'bills-of-lading',
    'vessels', 'tracking', 'history', 'audit', 'users', 'settings',
    'hold-authorization'
  ],
  operations: [
    'dashboard', 'customers', 'consolidations', 'bills-of-lading',
    'vessels', 'shipments', 'tracking'
  ],
  warehouse: [
    'dashboard', 'customers', 'warehouse-receipts',
    'documents', 'consolidations', 'tracking'
  ],
  documentation: [
    'dashboard', 'customers', 'warehouse-receipts', 'house-bills',
    'consolidations', 'shipments', 'bills-of-lading', 'tracking', 'hold-authorization'
  ],
  agent: [
    'dashboard', 'consolidations', 'shipments', 'bills-of-lading', 'tracking', 'documents'
  ]
};

export const getStoredPermissionsMap = () => {
  if (typeof window === 'undefined') return DEFAULT_ROLE_PERMISSIONS_MAP;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ROLE_PERMISSIONS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.super_admin) {
        // Self-heal shipments for core staff roles and agent if missing from legacy cache
        ['super_admin', 'operations', 'documentation', 'agent'].forEach(rk => {
          if (Array.isArray(parsed[rk]) && !parsed[rk].includes('shipments')) {
            parsed[rk].push('shipments');
          }
        });
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[RBAC] Error loading stored permissions:', e);
  }
  return DEFAULT_ROLE_PERMISSIONS_MAP;
};

export const saveStoredPermissionsMap = (map) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ROLE_PERMISSIONS, JSON.stringify(map));
  } catch (e) {
    console.warn('[RBAC] Error saving permissions map:', e);
  }
};

/**
 * Checks whether a given role is allowed to access a specific tab/module.
 */
export const hasModulePermission = (roleKey, tab) => {
  if (!roleKey) return false;
  if (roleKey === 'super_admin') return true;

  // Agent always has access to ocean shipments and core agent portal tabs
  if (roleKey === 'agent') {
    if (tab === 'shipments' || tab === 'agent-shipments' || tab === 'agent-dashboard' || tab === 'dashboard') {
      return true;
    }
  }

  const permissionsMap = getStoredPermissionsMap();
  const allowedModuleIds = permissionsMap[roleKey] || DEFAULT_ROLE_PERMISSIONS_MAP[roleKey] || [];

  if (allowedModuleIds.includes('*')) return true;

  // Direct match with module ID
  if (allowedModuleIds.includes(tab)) return true;

  // Find module that maps to this tab
  const matchedModule = SYSTEM_MODULES.find(m => m.tabs && m.tabs.includes(tab));
  if (matchedModule) {
    return allowedModuleIds.includes(matchedModule.id);
  }

  // Fallback for agent specific subroutes
  if (roleKey === 'agent' && tab && tab.startsWith('agent-')) {
    const raw = tab.replace('agent-', '');
    if (raw === 'dashboard') return allowedModuleIds.includes('dashboard');
    if (raw === 'documents') return allowedModuleIds.includes('documents');
    if (raw === 'shipments') return allowedModuleIds.includes('shipments');
    if (raw === 'tracking') return allowedModuleIds.includes('tracking');
    if (raw === 'bl-detail') return allowedModuleIds.includes('bills-of-lading');
    return allowedModuleIds.includes(raw);
  }

  return false;
};

/**
 * Checks whether a user can perform Hold / Release governance actions.
 */
export const canManageHolds = (roleKey) => {
  if (!roleKey) return false;
  if (roleKey === 'super_admin') return true;
  const permissionsMap = getStoredPermissionsMap();
  const allowedModuleIds = permissionsMap[roleKey] || DEFAULT_ROLE_PERMISSIONS_MAP[roleKey] || [];
  return allowedModuleIds.includes('hold-authorization');
};

/**
 * Checks whether a user can manage system users, roles, and global settings.
 */
export const isSystemAdmin = (roleKey) => {
  if (!roleKey) return false;
  if (roleKey === 'super_admin') return true;
  const permissionsMap = getStoredPermissionsMap();
  const allowedModuleIds = permissionsMap[roleKey] || DEFAULT_ROLE_PERMISSIONS_MAP[roleKey] || [];
  return allowedModuleIds.includes('users') && allowedModuleIds.includes('settings');
};

/**
 * Checks whether a user role has permission to access a specific document entity type.
 */
export const canAccessDocumentType = (roleKey, entityType) => {
  if (!roleKey || roleKey === 'super_admin') return true;

  const permissionsMap = getStoredPermissionsMap();
  const allowed = permissionsMap[roleKey] || DEFAULT_ROLE_PERMISSIONS_MAP[roleKey] || [];

  if (entityType === 'BL') {
    return allowed.includes('bills-of-lading') || allowed.includes('house-bills');
  }

  if (entityType === 'MANIFEST') {
    return allowed.includes('manifests');
  }

  return true;
};
