import { FastifyInstance } from 'fastify';
import { menusController } from './menus.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ROLES } from '../../common/constants/roles.js';

export async function menuRoutes(app: FastifyInstance): Promise<void> {
  // Option to allow unauthenticated or authenticated access per route if needed, here with preHandler auth
  app.addHook('preHandler', authenticate);

  // STAGE 1: Warehouse Menus
  app.get('/cfs-dashboard', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_STAFF, ROLES.OPERATIONS)] }, menusController.getCfsDashboard);
  app.get('/cargo-inventory', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_STAFF, ROLES.OPERATIONS)] }, menusController.getCargoInventory);
  app.get('/labels', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_STAFF, ROLES.OPERATIONS)] }, menusController.getLabels);
  app.get('/labels/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_STAFF, ROLES.OPERATIONS)] }, menusController.getLabels);

  // STAGE 2: Operations Menus
  app.get('/ops-dashboard', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS)] }, menusController.getOpsDashboard);
  app.get('/containers-vessels', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS, ROLES.DOCUMENTATION_STAFF)] }, menusController.getContainersVessels);

  // STAGE 3: Documentation Menus
  app.get('/docs-dashboard', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF)] }, menusController.getDocsDashboard);
  app.get('/shipping-manifests', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF)] }, menusController.getShippingManifests);
  app.get('/documents-archive', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF)] }, menusController.getDocumentsArchive);

  // STAGE 4: Destination Agent Menus
  app.get('/agent-dashboard', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.AGENT)] }, menusController.getAgentDashboard);
  app.get('/assigned-shipments', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.AGENT)] }, menusController.getAssignedShipments);
  app.get('/agent-documents', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.AGENT)] }, menusController.getAgentDocuments);

  // STAGE 5: Administrator Menus (Super Admin strictly)
  app.get('/admin-dashboard', { preHandler: [requireRole(ROLES.SUPER_ADMIN)] }, menusController.getAdminDashboard);
  app.get('/users-roles', { preHandler: [requireRole(ROLES.SUPER_ADMIN)] }, menusController.getUsersRoles);
  app.get('/audit-trail', { preHandler: [requireRole(ROLES.SUPER_ADMIN)] }, menusController.getAuditTrail);
  app.get('/shipment-history', { preHandler: [requireRole(ROLES.SUPER_ADMIN)] }, menusController.getShipmentHistory);
}
