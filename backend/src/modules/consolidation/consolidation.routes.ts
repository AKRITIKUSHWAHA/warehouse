import { FastifyInstance } from 'fastify';
import { consolidationController } from './consolidation.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { enforcePortIsolation } from '../../middleware/port-isolation.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ROLES } from '../../common/constants/roles.js';

export async function consolidationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', enforcePortIsolation);

  app.get('/', consolidationController.list);
  app.get('/:id', consolidationController.getById);
  app.post(
    '/',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS_STAFF, ROLES.DOCUMENTATION_STAFF)] },
    consolidationController.create
  );
  app.put(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS_STAFF, ROLES.DOCUMENTATION_STAFF)] },
    consolidationController.update
  );
  app.patch(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS_STAFF, ROLES.DOCUMENTATION_STAFF)] },
    consolidationController.update
  );
  app.delete(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN)] },
    consolidationController.delete
  );
}
