import { FastifyInstance } from 'fastify';
import { warehouseController } from './warehouse.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { enforcePortIsolation } from '../../middleware/port-isolation.middleware.js';

export async function warehouseRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', enforcePortIsolation);

  app.get('/', warehouseController.list);
  app.get('/:id', warehouseController.getById);
  app.post('/', warehouseController.create);
  app.patch('/:id', warehouseController.update);
  app.delete('/:id', warehouseController.delete);
}
