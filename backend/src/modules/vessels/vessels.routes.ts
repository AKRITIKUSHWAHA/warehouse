import { FastifyInstance } from 'fastify';
import { vesselsController } from './vessels.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ROLES } from '../../common/constants/roles.js';

export async function vesselsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/', vesselsController.list);
  app.get('/:id', vesselsController.getById);
  app.post('/', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS, ROLES.DOCUMENTATION_STAFF)] }, vesselsController.create);
  app.put('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS, ROLES.DOCUMENTATION_STAFF)] }, vesselsController.update);
  app.patch('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS, ROLES.DOCUMENTATION_STAFF)] }, vesselsController.update);
  app.delete('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS)] }, vesselsController.delete);
}

