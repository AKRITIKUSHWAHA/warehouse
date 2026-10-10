import { FastifyInstance } from 'fastify';
import { portsController } from './ports.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ROLES } from '../../common/constants/roles.js';

export async function portsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/', portsController.list);
  app.get('/:id', portsController.getById);
  app.post('/', { preHandler: [requireRole(ROLES.SUPER_ADMIN)] }, portsController.create);
  app.put('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN)] }, portsController.update);
  app.patch('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN)] }, portsController.update);
  app.delete('/:id', { preHandler: [requireRole(ROLES.SUPER_ADMIN)] }, portsController.delete);
}
