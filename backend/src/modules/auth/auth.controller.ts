import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService, authService } from './auth.service.js';
import { loginSchema } from './auth.schema.js';
import { successResponse } from '../../common/utils/response.js';
import { AppError } from '../../common/errors/app-error.js';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  login = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const validatedBody = loginSchema.parse(request.body);
    const user = await this.service.validateCredentials(validatedBody);

    const token = request.server.jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      roleKey: user.roleKey,
      agentId: user.agentId,
      destinationPortCode: user.destinationPortCode,
    });

    reply.send(
      successResponse(
        {
          token,
          user,
        },
        'Login successful'
      )
    );
  };

  switchUser = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = (request.body || {}) as { userId?: string; email?: string };
    const target = body.userId || body.email;
    if (!target) {
      throw new AppError('User ID or Email is required to switch user', 400, true);
    }

    const user = await this.service.switchUser(target);

    const token = request.server.jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      roleKey: user.roleKey,
      agentId: user.agentId,
      destinationPortCode: user.destinationPortCode,
    });

    reply.send(
      successResponse(
        {
          token,
          user,
        },
        'Switched user successfully'
      )
    );
  };

  me = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const currentUserId = request.user.id;
    const user = await this.service.getMe(currentUserId);
    reply.send(successResponse(user));
  };

  logout = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.send(successResponse({ loggedOut: true }, 'Logout successful'));
  };
}

export const authController = new AuthController();
