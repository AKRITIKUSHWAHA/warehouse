import { FastifyInstance } from 'fastify';
import { warehouseController } from './warehouse.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { enforcePortIsolation } from '../../middleware/port-isolation.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ROLES } from '../../common/constants/roles.js';

export async function warehouseRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', enforcePortIsolation);

  app.get('/', warehouseController.list);
  app.get('/next-number', warehouseController.getNextNumber);
  app.get('/:id', warehouseController.getById);

  app.post(
    '/',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF, ROLES.OPERATIONS, ROLES.WAREHOUSE)] },
    warehouseController.create
  );
  app.put(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF, ROLES.OPERATIONS, ROLES.WAREHOUSE)] },
    warehouseController.update
  );
  app.patch(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF, ROLES.OPERATIONS, ROLES.WAREHOUSE)] },
    warehouseController.update
  );
  app.delete(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF)] },
    warehouseController.delete
  );
}
