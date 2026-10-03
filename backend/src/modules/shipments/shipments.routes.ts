import { FastifyInstance } from 'fastify';
import { shipmentsController } from './shipments.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { enforcePortIsolation } from '../../middleware/port-isolation.middleware.js';

export async function shipmentsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', enforcePortIsolation);

  app.get('/', shipmentsController.list);
  app.get('/:id', shipmentsController.getById);
  app.post('/', shipmentsController.create);
  app.put('/:id', shipmentsController.update);
  app.patch('/:id', shipmentsController.update);
  app.put('/:id', shipmentsController.update);
  app.delete('/:id', shipmentsController.delete);
}
