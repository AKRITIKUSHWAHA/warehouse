import { FastifyInstance } from 'fastify';
import { agentsController } from './agents.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ROLES } from '../../common/constants/roles.js';

export async function agentsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/', agentsController.list);
  app.get('/:id', agentsController.getById);
  app.post('/', { preHandler: [requireRole(ROLES.SUPER_ADMIN)] }, agentsController.create);
  app.put('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN)] }, agentsController.update);
  app.patch('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN)] }, agentsController.update);
  app.delete('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN)] }, agentsController.delete);
}

