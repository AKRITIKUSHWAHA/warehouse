export const initialUsers = [
  {
    id: "USR-001",
    name: "Marcus Vance",
    email: "marcus.vance@vicustoms.com",
    role: "Super Admin",
    roleKey: "super_admin",
    department: "Executive & Global Operations",
    status: "Active",
    avatar: "MV",
    lastLogin: "2026-08-29 08:30 AM",
    phone: "+1 (305) 555-0100"
  },
  {
    id: "USR-003",
    name: "Carlos Mendez",
    email: "carlos.m@vicustoms.com",
    role: "Warehouse Staff",
    roleKey: "warehouse",
    department: "Miami CFS Warehouse",
    status: "Active",
    avatar: "CM",
    lastLogin: "2026-08-29 07:45 AM",
    phone: "+1 (305) 555-0188"
  },
  {
    id: "USR-004",
    name: "Destination Agent Staff",
    email: "agent@vicustoms.com",
    role: "Destination Agent",
    roleKey: "agent",
    department: "Destination Agency Hub",
    agentId: null,
    status: "Active",
    avatar: "AG",
    lastLogin: "2026-10-21 08:00 AM",
    phone: "+1 (305) 555-0177"
  }
];

export const initialRolesPermissions = [
  {
    roleKey: "super_admin",
    roleName: "Super Admin",
    description: "Full global system access, role management, user administration, financial overrides and hold releases.",
    userCount: 1,
    permissions: {
      warehouseReceipts: { view: true, create: true, edit: true, delete: true },
      cargo: { view: true, create: true, edit: true, delete: true },
      consolidations: { view: true, create: true, edit: true, delete: true },
      shipments: { view: true, create: true, edit: true, delete: true },
      billsOfLading: { view: true, create: true, edit: true, placeHold: true, clearHold: true, release: true, cancel: true },
      manifests: { view: true, generate: true, export: true },
      agentPortal: { view: true, manage: true },
      auditTrail: { view: true, export: true },
      systemSettings: { view: true, edit: true }
    }
  },
  {
    roleKey: "warehouse",
    roleName: "Warehouse Staff",
    description: "Receives cargo, measures package dimensions & weight, creates Warehouse Receipts, and prints 4x6 labels.",
    userCount: 4,
    permissions: {
      warehouseReceipts: { view: true, create: true, edit: true, delete: false },
      cargo: { view: true, create: true, edit: true, delete: false },
      consolidations: { view: false, create: false, edit: false, delete: false },
      shipments: { view: false, create: false, edit: false, delete: false },
      billsOfLading: { view: false, create: false, edit: false, placeHold: false, clearHold: false, release: false, cancel: false },
      manifests: { view: false, generate: false, export: false },
      agentPortal: { view: false, manage: false },
      auditTrail: { view: false, export: false },
      systemSettings: { view: false, edit: false },
      customers: { view: true, create: true, edit: false, delete: false },
      documents: { view: true, create: true, edit: false, delete: false }
    }
  },
  {
    roleKey: "agent",
    roleName: "Destination Agent",
    description: "Dedicated portal access for agents. Export manifests, view assigned shipments, update consolidation statuses, receive cargo, and prepare HBLs.",
    userCount: 8,
    permissions: {
      warehouseReceipts: { view: true, create: true, edit: true, delete: false },
      cargo: { view: true, create: true, edit: true, delete: false },
      consolidations: { view: true, create: false, edit: true, delete: false },
      shipments: { view: true, create: false, edit: false, delete: false },
      billsOfLading: { view: true, create: true, edit: true, placeHold: false, clearHold: false, release: false, cancel: false },
      manifests: { view: true, generate: false, export: false },
      agentPortal: { view: true, manage: false },
      auditTrail: { view: false, export: false },
      systemSettings: { view: false, edit: false }
    }
  }
];
