import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../common/errors/app-error.js';
import { JwtUserPayload } from '../common/types/auth.types.js';

export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Unauthorized: Missing or invalid Authorization header', 401, true);
  }

  try {
    const decoded = await request.jwtVerify<JwtUserPayload>();
    request.user = decoded;
  } catch (_err) {
    throw new AppError('Unauthorized: Invalid or expired token', 401, true);
  }
}
