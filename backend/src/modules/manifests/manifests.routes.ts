import { FastifyInstance } from 'fastify';
import { manifestsController } from './manifests.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ROLES } from '../../common/constants/roles.js';

export async function manifestsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/', manifestsController.list);
  app.get('/:id', manifestsController.getById);
  app.post(
    '/',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF)] },
    manifestsController.create
  );
  app.patch(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF)] },
    manifestsController.update
  );
  app.put(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN, ROLES.DOCUMENTATION_STAFF)] },
    manifestsController.update
  );
  app.delete(
    '/:id',
    { preHandler: [requireRole(ROLES.SUPER_ADMIN)] },
    manifestsController.delete
  );
}
