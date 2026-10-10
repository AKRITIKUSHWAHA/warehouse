import { FastifyInstance } from 'fastify';
import { houseBillsController } from './house-bills.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { enforcePortIsolation } from '../../middleware/port-isolation.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ROLES } from '../../common/constants/roles.js';

export async function houseBillsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', enforcePortIsolation);

  app.get('/', houseBillsController.list);
  app.get('/:id', houseBillsController.getById);

  app.post(
    '/',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF, ROLES.OPERATIONS, ROLES.WAREHOUSE, ROLES.PORT_AGENT)] },
    houseBillsController.create
  );
  app.put(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF, ROLES.OPERATIONS, ROLES.WAREHOUSE)] },
    houseBillsController.update
  );
  app.patch(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF, ROLES.OPERATIONS, ROLES.WAREHOUSE)] },
    houseBillsController.update
  );
  app.delete(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN)] },
    houseBillsController.delete
  );
  app.post(
    '/:id/hold',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF)] },
    houseBillsController.placeHold
  );
  app.post(
    '/:id/release',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF)] },
    houseBillsController.releaseHold
  );
}

