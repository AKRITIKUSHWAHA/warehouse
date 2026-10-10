/**
 * Single Source of Truth for Role-Based Access Control (RBAC)
 * Strictly matches client requirements for VI Customs Brokers & Logistics.
 */

export const ROLE_PERMISSIONS = {
  // 1. Warehouse & Operations Floor Staff (Carlos Mendez / Warehouse Ops)
  warehouse: [
    'dashboard',
    'customers',
    'warehouse-receipts',
    'cargo',
    'house-bills',
    'consolidations',
    'documents',
    'tracking'
  ],

  // 2. Operations Coordinator (Elena Rostova / Logistics & Stuffing)
  operations: [
    'dashboard',
    'customers',
    'warehouse-receipts',
    'cargo',
    'house-bills',
    'consolidations',
    'shipments',
    'containers',
    'vessels',
    'documents',
    'tracking',
    'history'
  ],

  // 3. Documentation Specialist (Sarah Jenkins / Ocean Carrier & Customs Documentation)
  documentation: [
    'dashboard',
    'customers',
    'warehouse-receipts',
    'house-bills',
    'bills-of-lading',
    'manifests',
    'consolidations',
    'containers',
    'vessels',
    'history',
    'documents',
    'tracking'
  ],

  // 4. Port Agent (David Cartwright / Location-scoped Agent Portal)
  agent: [
    'agent-dashboard',
    'agent-shipments',
    'agent-bl-detail',
    'agent-documents',
    'agent-tracking',
    'shipments',
    'consolidations',
    'manifests',
    'bills-of-lading',
    'cargo',
    'tracking'
  ],

  // 5. Super Admin (Marcus Vance / Global HQ Root Access)
  super_admin: [
    '*' // Full unrestricted access
  ]
};

/**
 * Checks whether a given role is allowed to access a specific tab/module.
 */
export const hasModulePermission = (roleKey, tab) => {
  if (!roleKey) return false;
  if (roleKey === 'super_admin') return true;

  const allowedTabs = ROLE_PERMISSIONS[roleKey];
  if (!allowedTabs) return false;

  if (allowedTabs.includes('*')) return true;
  return allowedTabs.includes(tab);
};

/**
 * Checks whether a user can perform Hold / Release governance actions.
 * As per client specification: Documentation and Super Admin manage holds.
 */
export const canManageHolds = (roleKey) => {
  return roleKey === 'super_admin' || roleKey === 'documentation';
};

/**
 * Checks whether a user can manage system users, roles, and global settings.
 */
export const isSystemAdmin = (roleKey) => {
  return roleKey === 'super_admin';
};

/**
 * Checks whether a user role has permission to access a specific document entity type.
 * Client Requirements:
 * - Warehouse / Operations: Warehouse Receipts, Cargo Labels, Supporting Documents, House Bills of Lading.
 *   (Master Bills of Lading and Ocean Manifests belong exclusively to Documentation & Super Admin).
 * - Documentation & Super Admin: Full document repository access (Master B/L, Manifests, WR, HBL, Uploads).
 * - Agent: Assigned port manifests, destination House Bills, WR, and uploads.
 */
export const canAccessDocumentType = (roleKey, entityType) => {
  if (!roleKey || roleKey === 'super_admin' || roleKey === 'documentation') return true;

  if (entityType === 'BL') {
    return roleKey === 'super_admin' || roleKey === 'documentation' || roleKey === 'agent';
  }

  if (entityType === 'MANIFEST') {
    return roleKey === 'super_admin' || roleKey === 'documentation' || roleKey === 'agent';
  }

  // WR, HBL, UPLOAD are accessible to warehouse and operations
  return true;
};
