import { FastifyInstance } from 'fastify';
import { cargoController } from './cargo.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { enforcePortIsolation } from '../../middleware/port-isolation.middleware.js';

export async function cargoRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', enforcePortIsolation);

  app.get('/', cargoController.list);
  app.get('/:id', cargoController.getById);
  app.post('/', cargoController.create);
  app.put('/:id', cargoController.update);
  app.delete('/:id', cargoController.delete);
}
