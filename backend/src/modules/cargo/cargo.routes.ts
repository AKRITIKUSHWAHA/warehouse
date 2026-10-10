import { FastifyInstance } from 'fastify';
import { cargoController } from './cargo.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { enforcePortIsolation } from '../../middleware/port-isolation.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ROLES } from '../../common/constants/roles.js';

export async function cargoRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', enforcePortIsolation);

  app.get('/', cargoController.list);
  app.get('/:id', cargoController.getById);
  app.post(
    '/',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS_STAFF, ROLES.DOCUMENTATION_STAFF, ROLES.WAREHOUSE_STAFF)] },
    cargoController.create
  );
  app.put(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS_STAFF, ROLES.DOCUMENTATION_STAFF, ROLES.WAREHOUSE_STAFF)] },
    cargoController.update
  );
  app.patch(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS_STAFF, ROLES.DOCUMENTATION_STAFF, ROLES.WAREHOUSE_STAFF)] },
    cargoController.update
  );
  app.delete(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN)] },
    cargoController.delete
  );
}

