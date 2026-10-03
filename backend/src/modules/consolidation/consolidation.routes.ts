import { FastifyInstance } from 'fastify';
import { consolidationController } from './consolidation.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { enforcePortIsolation } from '../../middleware/port-isolation.middleware.js';

export async function consolidationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', enforcePortIsolation);

  app.get('/', consolidationController.list);
  app.get('/:id', consolidationController.getById);
  app.post('/', consolidationController.create);
  app.put('/:id', consolidationController.update);
  app.patch('/:id', consolidationController.update);
  app.delete('/:id', consolidationController.delete);
}
