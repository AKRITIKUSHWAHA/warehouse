/**
 * Dynamic Single Source of Truth for Role-Based Access Control (RBAC) & Menu Visibility
 * Allows Super Admin to dynamically configure menu visibility and module access per role.
 */

export const STORAGE_KEY_ROLE_PERMISSIONS = 'kers_role_permissions_map_v10';

export const SYSTEM_MODULES = [
  // 1. 3-STEP CARGO WORKFLOW
  {
    id: 'dashboard',
    label: 'Overview Dashboard',
    category: '3-Step Cargo Workflow',
    description: 'Operational summary metrics, quick actions, and throughput charts',
    icon: 'LayoutDashboard',
    tabs: ['dashboard', 'agent-dashboard']
  },
  {
    id: 'warehouse-receipts',
    label: '1. Warehouse Receipts (Step 1)',
    category: '3-Step Cargo Workflow',
    description: 'Cargo intake, dimension calculations, barcode generation, intake receipts',
    icon: 'Package',
    tabs: ['warehouse-receipts']
  },
  {
    id: 'house-bills',
    label: '2. House Bills of Lading (Step 2)',
    category: '3-Step Cargo Workflow',
    description: 'Generate, edit, print House B/Ls linked with company Consolidation #',
    icon: 'FileText',
    tabs: ['house-bills']
  },
  {
    id: 'bills-of-lading',
    label: '3. Master Bills & Manifests (Step 3)',
    category: '3-Step Cargo Workflow',
    description: 'Carrier master B/Ls, auto-gather HBLs by Consolidation #, 1-click manifest generation',
    icon: 'FileSpreadsheet',
    tabs: ['bills-of-lading', 'manifests']
  },

  // 2. SYSTEM & SETTINGS
  {
    id: 'users',
    label: 'Users & Roles Matrix',
    category: 'System & Settings',
    description: 'Manage staff accounts, credentials, role permissions & menu visibility matrix',
    icon: 'ShieldCheck',
    tabs: ['users']
  },
  {
    id: 'settings',
    label: 'System Settings & Config',
    category: 'System & Settings',
    description: 'Global numbering rules, company profiles, and document prefixes',
    icon: 'Settings',
    tabs: ['settings']
  }
];

export const DEFAULT_ROLE_PERMISSIONS_MAP = {
  super_admin: [
    'dashboard', 'warehouse-receipts', 'house-bills', 'bills-of-lading', 'users', 'settings'
  ],
  warehouse: [
    'dashboard', 'warehouse-receipts'
  ],
  agent: [
    'dashboard', 'bills-of-lading'
  ],
  // Legacy roles (kept commented for backward compatibility):
  operations: [
    'dashboard', 'warehouse-receipts', 'house-bills', 'bills-of-lading'
  ],
  documentation: [
    'dashboard', 'warehouse-receipts', 'house-bills', 'bills-of-lading'
  ]
};

export const getStoredPermissionsMap = () => {
  const validIds = new Set(SYSTEM_MODULES.map(m => m.id));
  if (typeof window === 'undefined') return DEFAULT_ROLE_PERMISSIONS_MAP;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ROLE_PERMISSIONS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.super_admin) {
        const cleaned = {};
        Object.keys(parsed).forEach(rk => {
          if (Array.isArray(parsed[rk])) {
            cleaned[rk] = parsed[rk].filter(id => validIds.has(id));
          } else {
            cleaned[rk] = DEFAULT_ROLE_PERMISSIONS_MAP[rk] || [];
          }
        });
        cleaned.super_admin = Array.from(validIds);
        return cleaned;
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

  // Ocean Shipments is a core module accessible to all authenticated roles
  if (tab === 'shipments' || tab === 'agent-shipments') {
    return true;
  }

  // Agent always has access to core agent portal tabs
  if (roleKey === 'agent') {
    if (tab === 'agent-dashboard' || tab === 'dashboard') {
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
