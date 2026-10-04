import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { loginRateLimit } from '../../middleware/rate-limit.middleware.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Public route: Login (protected with IP rate limiting: 5 requests / min)
  app.post('/login', { preHandler: [loginRateLimit] }, authController.login);

  // Protected route: Get Current User Profile
  app.get('/me', { preHandler: [authenticate] }, authController.me);

  // Protected route: Logout
  app.post('/logout', { preHandler: [authenticate] }, authController.logout);
}
