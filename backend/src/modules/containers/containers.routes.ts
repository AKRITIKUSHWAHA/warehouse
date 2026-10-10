import { FastifyInstance } from 'fastify';
import { containersController } from './containers.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ROLES } from '../../common/constants/roles.js';

export async function containersRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/', containersController.list);
  app.get('/:id', containersController.getById);
  app.post('/', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS, ROLES.DOCUMENTATION_STAFF)] }, containersController.create);
  app.put('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS, ROLES.DOCUMENTATION_STAFF)] }, containersController.update);
  app.patch('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS, ROLES.DOCUMENTATION_STAFF)] }, containersController.update);
  app.delete('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS, ROLES.DOCUMENTATION_STAFF)] }, containersController.delete);
}

