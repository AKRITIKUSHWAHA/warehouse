/**
 * Dynamic Single Source of Truth for Role-Based Access Control (RBAC) & Menu Visibility
 * Allows Super Admin to dynamically configure menu visibility and module access per role.
 */

export const STORAGE_KEY_ROLE_PERMISSIONS = 'kers_role_permissions_map_v2';

export const SYSTEM_MODULES = [
  {
    id: 'dashboard',
    label: 'Overview Dashboard',
    category: 'Intake & Core',
    description: 'Operational summary metrics, quick actions, and throughput charts',
    icon: 'LayoutDashboard',
    tabs: ['dashboard', 'agent-dashboard']
  },
  {
    id: 'customers',
    label: 'Customers',
    category: 'Intake & Core',
    description: 'Master customer directory (shippers & consignees), contact details and destination ports',
    icon: 'Users',
    tabs: ['customers']
  },
  {
    id: 'warehouse-receipts',
    label: 'Warehouse Receipts: View & Intake',
    category: 'Intake & Core',
    description: 'Cargo intake, dimension calculations, barcode generation, receipts',
    icon: 'Package',
    tabs: ['warehouse-receipts']
  },
  {
    id: 'cargo',
    label: 'Cargo Inventory & Items',
    category: 'Intake & Core',
    description: 'Real-time package storage, location racking, holding bay tracking',
    icon: 'Box',
    tabs: ['cargo']
  },
  {
    id: 'documents',
    label: 'Labels & Document Center',
    category: 'Intake & Core',
    description: '4x6 thermal barcode labels, print layouts, uploaded paperwork',
    icon: 'FileStack',
    tabs: ['documents', 'agent-documents']
  },
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
    label: 'Cargo Consolidation Engine',
    category: 'Logistics & Ocean',
    description: 'Multi-order container stuffing, CBM load balancing, sealing',
    icon: 'Layers',
    tabs: ['consolidations']
  },
  {
    id: 'shipments',
    label: 'Ocean Shipments',
    category: 'Logistics & Ocean',
    description: 'Voyage assignments, container tracking, port-to-port manifests',
    icon: 'Ship',
    tabs: ['shipments', 'agent-shipments']
  },
  {
    id: 'bills-of-lading',
    label: 'Master Bills of Lading (MBL)',
    category: 'Logistics & Ocean',
    description: 'Carrier master B/Ls, consignee endorsement, release documents',
    icon: 'FileText',
    tabs: ['bills-of-lading', 'agent-bl-detail']
  },
  {
    id: 'manifests',
    label: 'Customs & Port Manifests',
    category: 'Logistics & Ocean',
    description: 'Official customs manifest generation, export to CSV/PDF',
    icon: 'FileSpreadsheet',
    tabs: ['manifests']
  },
  {
    id: 'containers',
    label: 'Containers Inventory',
    category: 'Logistics & Ocean',
    description: '20ft/40ft/40HC container fleet, seal numbers, tare weights',
    icon: 'Box',
    tabs: ['containers']
  },
  {
    id: 'vessels',
    label: 'Vessels & Trips',
    category: 'Logistics & Ocean',
    description: 'Vessel schedules, voyages, carrier coordination, transit timelines',
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
  {
    id: 'agent-portal',
    label: 'Dedicated Agent Portal Access',
    category: 'Agent & External',
    description: 'Isolated portal access for destination port agents & forwarders',
    icon: 'ExternalLink',
    tabs: ['agent-dashboard', 'agent-shipments', 'agent-bl-detail', 'agent-documents', 'agent-tracking']
  },
  {
    id: 'hold-authorization',
    label: 'Place / Clear B/L Hold (Authorization)',
    category: 'Governance & Security',
    description: 'Administrative hold override, financial lock releases, compliance',
    icon: 'Shield',
    tabs: []
  },
  {
    id: 'users',
    label: 'Users & Roles Matrix',
    category: 'Governance & Security',
    description: 'Manage staff accounts, credentials, role permissions matrix',
    icon: 'ShieldCheck',
    tabs: ['users']
  },
  {
    id: 'audit',
    label: 'Activity Logs / Audit Trail',
    category: 'Governance & Security',
    description: 'Immutable transaction logs, IP recording, change history inspection',
    icon: 'Activity',
    tabs: ['audit']
  },
  {
    id: 'history',
    label: 'Shipment Archive & History',
    category: 'Governance & Security',
    description: 'Historical voyage logs, delivered container lookup, past records',
    icon: 'History',
    tabs: ['history']
  },
  {
    id: 'settings',
    label: 'System Settings & Config',
    category: 'Governance & Security',
    description: 'Global numbering rules, company profiles, currency & fee defaults',
    icon: 'Settings',
    tabs: ['settings']
  }
];

export const DEFAULT_ROLE_PERMISSIONS_MAP = {
  super_admin: [
    'dashboard', 'customers', 'warehouse-receipts', 'cargo', 'documents',
    'house-bills', 'consolidations', 'shipments', 'bills-of-lading', 'manifests',
    'containers', 'vessels', 'tracking', 'agent-portal', 'hold-authorization',
    'users', 'audit', 'history', 'settings'
  ],
  operations: [
    'dashboard', 'customers', 'warehouse-receipts', 'cargo', 'documents',
    'house-bills', 'consolidations', 'shipments', 'manifests',
    'containers', 'vessels', 'tracking', 'history'
  ],
  warehouse: [
    'dashboard', 'customers', 'warehouse-receipts', 'cargo', 'documents',
    'house-bills', 'consolidations', 'tracking'
  ],
  documentation: [
    'dashboard', 'customers', 'warehouse-receipts', 'documents',
    'house-bills', 'bills-of-lading', 'manifests', 'consolidations',
    'containers', 'vessels', 'tracking', 'history', 'hold-authorization'
  ],
  agent: [
    'dashboard', 'agent-portal', 'shipments', 'consolidations', 'manifests',
    'bills-of-lading', 'cargo', 'tracking', 'documents'
  ]
};

export const getStoredPermissionsMap = () => {
  if (typeof window === 'undefined') return DEFAULT_ROLE_PERMISSIONS_MAP;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ROLE_PERMISSIONS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.super_admin) {
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
    return allowedModuleIds.includes('agent-portal') || allowedModuleIds.includes(tab.replace('agent-', ''));
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
