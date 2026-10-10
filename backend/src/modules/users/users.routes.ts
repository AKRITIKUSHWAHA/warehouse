import { FastifyInstance } from 'fastify';
import { usersController } from './users.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ROLES } from '../../common/constants/roles.js';

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // GET users is allowed for all authenticated staff for directory/user selection
  app.get('/', usersController.list);
  app.get('/:id', usersController.getById);

  // User modification requires Super Admin privileges
  app.post('/', { preHandler: [requireRole(ROLES.SUPER_ADMIN)] }, usersController.create);
  app.put('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN)] }, usersController.update);
  app.patch('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN)] }, usersController.update);
  app.delete('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN)] }, usersController.delete);
}
