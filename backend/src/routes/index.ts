import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { usersRoutes } from '../modules/users/users.routes.js';
import { customersRoutes } from '../modules/customers/customers.routes.js';
import { portsRoutes } from '../modules/ports/ports.routes.js';
import { agentsRoutes } from '../modules/agents/agents.routes.js';
import { warehouseRoutes } from '../modules/warehouse/warehouse.routes.js';
import { cargoRoutes } from '../modules/cargo/cargo.routes.js';
import { houseBillsRoutes } from '../modules/house-bills/house-bills.routes.js';
import { consolidationRoutes } from '../modules/consolidation/consolidation.routes.js';
import { containersRoutes } from '../modules/containers/containers.routes.js';
import { vesselsRoutes } from '../modules/vessels/vessels.routes.js';
import { voyagesRoutes } from '../modules/voyages/voyages.routes.js';
import { shipmentsRoutes } from '../modules/shipments/shipments.routes.js';
import { billsOfLadingRoutes } from '../modules/bills-of-lading/bills-of-lading.routes.js';
import { manifestsRoutes } from '../modules/manifests/manifests.routes.js';
import { documentsRoutes } from '../modules/documents/documents.routes.js';
import { trackingRoutes } from '../modules/tracking/tracking.routes.js';
import { auditRoutes } from '../modules/audit/audit.routes.js';
import { historyRoutes } from '../modules/history/history.routes.js';
import { settingsRoutes } from '../modules/settings/settings.routes.js';
import { adminRoutes } from '../modules/admin/admin.routes.js';
import { menuRoutes } from '../modules/menus/menus.routes.js';
import { APP_CONSTANTS } from '../config/constants.js';

export async function registerAppRoutes(app: FastifyInstance): Promise<void> {
  // Top-level unversioned health check
  await app.register(healthRoutes, { prefix: '/health' });

  // Versioned API routes (/api/v1)
  await app.register(
    async (v1) => {
      await v1.register(healthRoutes, { prefix: '/health' });
      await v1.register(authRoutes, { prefix: '/auth' });
      await v1.register(usersRoutes, { prefix: '/users' });
      await v1.register(customersRoutes, { prefix: '/customers' });
      await v1.register(portsRoutes, { prefix: '/ports' });
      await v1.register(agentsRoutes, { prefix: '/agents' });
      await v1.register(warehouseRoutes, { prefix: '/warehouse-receipts' });
      await v1.register(cargoRoutes, { prefix: '/cargo' });
      await v1.register(houseBillsRoutes, { prefix: '/house-bills' });
      await v1.register(consolidationRoutes, { prefix: '/consolidations' });
      await v1.register(containersRoutes, { prefix: '/containers' });
      await v1.register(vesselsRoutes, { prefix: '/vessels' });
      await v1.register(voyagesRoutes, { prefix: '/voyages' });
      await v1.register(shipmentsRoutes, { prefix: '/shipments' });
      await v1.register(billsOfLadingRoutes, { prefix: '/bills-of-lading' });
      await v1.register(manifestsRoutes, { prefix: '/manifests' });
      await v1.register(documentsRoutes, { prefix: '/documents' });
      await v1.register(trackingRoutes, { prefix: '/tracking' });
      await v1.register(auditRoutes, { prefix: '/audit' });
      await v1.register(historyRoutes, { prefix: '/history' });
      await v1.register(settingsRoutes, { prefix: '/settings' });
      await v1.register(adminRoutes, { prefix: '/admin' });
      await v1.register(menuRoutes);
    },
    { prefix: APP_CONSTANTS.API_PREFIX }
  );
}
