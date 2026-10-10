import { FastifyInstance } from 'fastify';
import { historyController } from './history.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

export async function historyRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // Shipment History & Calculations with full lifecycle flow
  app.get('/', historyController.list);
  app.get('/shipments', historyController.list);
  app.get('/shipments/:id', historyController.getById);
  app.get('/export', historyController.exportCsv);
}
