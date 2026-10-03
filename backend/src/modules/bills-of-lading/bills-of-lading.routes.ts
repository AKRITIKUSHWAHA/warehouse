import { FastifyInstance } from 'fastify';
import { billsOfLadingController } from './bills-of-lading.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ROLES } from '../../common/constants/roles.js';

export async function billsOfLadingRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/', billsOfLadingController.list);
  app.get('/:id', billsOfLadingController.getById);
  app.post('/', billsOfLadingController.create);
  app.put('/:id', billsOfLadingController.update);
  app.patch('/:id', billsOfLadingController.update);
  app.put('/:id', billsOfLadingController.update);
  app.delete('/:id', billsOfLadingController.delete);

  // Hold governance: Only Super Admin & Documentation Staff can place or clear holds
  app.post(
    '/:id/hold',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF)] },
    billsOfLadingController.placeHold
  );
  app.post(
    '/:id/release',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF)] },
    billsOfLadingController.clearHold
  );
}
