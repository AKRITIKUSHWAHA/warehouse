export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OPERATIONS: 'operations',
  OPERATIONS_STAFF: 'operations',
  WAREHOUSE: 'warehouse',
  WAREHOUSE_STAFF: 'warehouse',
  OPERATIONS_COORDINATOR: 'operations',
  DOCUMENTATION_STAFF: 'documentation',
  PORT_AGENT: 'agent',
  AGENT: 'agent',
} as const;

export type RoleType = 'super_admin' | 'operations' | 'warehouse' | 'documentation' | 'agent';

export const ROLE_DISPLAY_NAMES: Record<RoleType, string> = {
  super_admin: 'Super Admin',
  operations: 'Operations Coordinator',
  warehouse: 'Warehouse Staff',
  documentation: 'Documentation Staff',
  agent: 'Agent',
};

export const ALL_ROLES: RoleType[] = ['super_admin', 'operations', 'warehouse', 'documentation', 'agent'];
