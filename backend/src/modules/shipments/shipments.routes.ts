import { FastifyInstance } from 'fastify';
import { shipmentsController } from './shipments.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { enforcePortIsolation } from '../../middleware/port-isolation.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ROLES } from '../../common/constants/roles.js';

export async function shipmentsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', enforcePortIsolation);

  app.get('/', shipmentsController.list);
  app.get('/:id', shipmentsController.getById);
  app.post(
    '/',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS_STAFF, ROLES.DOCUMENTATION_STAFF)] },
    shipmentsController.create
  );
  app.put(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS_STAFF, ROLES.DOCUMENTATION_STAFF)] },
    shipmentsController.update
  );
  app.patch(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS_STAFF, ROLES.DOCUMENTATION_STAFF)] },
    shipmentsController.update
  );
  app.delete(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN)] },
    shipmentsController.delete
  );
}
