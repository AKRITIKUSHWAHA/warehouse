import { FastifyInstance } from 'fastify';
import { voyagesController } from './voyages.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ROLES } from '../../common/constants/roles.js';

export async function voyagesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/', voyagesController.list);
  app.get('/:id', voyagesController.getById);
<<<<<<< HEAD
  app.post('/', voyagesController.create);
  app.put('/:id', voyagesController.update);
  app.patch('/:id', voyagesController.update);
  app.delete('/:id', voyagesController.delete);
=======
  app.post('/', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS)] }, voyagesController.create);
  app.patch('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS)] }, voyagesController.update);
  app.put('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS)] }, voyagesController.update);
  app.delete('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.OPERATIONS)] }, voyagesController.delete);
>>>>>>> cd5336dd0aa4dc9bc5f6babb410f9351c3606c8b
}

