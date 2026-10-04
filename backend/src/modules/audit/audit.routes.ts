import { FastifyInstance } from 'fastify';
import { auditController } from './audit.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ROLES } from '../../common/constants/roles.js';

export async function auditRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS, ROLES.WAREHOUSE_STAFF, ROLES.DOCUMENTATION_STAFF, ROLES.AGENT));

  app.get('/', auditController.list);
  app.post('/', auditController.create);
}

