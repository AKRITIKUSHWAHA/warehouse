import { FastifyInstance } from 'fastify';
import { trackingController } from './tracking.controller.js';

export async function trackingRoutes(app: FastifyInstance): Promise<void> {
  // Public tracking endpoints
  app.get('/', trackingController.list);
  app.get('/:trackingNumber', trackingController.lookup);
}
