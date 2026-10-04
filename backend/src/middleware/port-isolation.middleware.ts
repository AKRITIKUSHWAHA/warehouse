import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../common/errors/app-error.js';
import { ROLES } from '../common/constants/roles.js';

/**
 * Enforces port isolation for Port Agents.
 * If the user has the 'agent' role, this middleware ensures they cannot access or modify
 * records that do not belong to their assigned destination port code.
 */
export async function enforcePortIsolation(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const user = request.user;
  if (!user) {
    throw new AppError('Unauthorized: User not authenticated', 401, true);
  }

  // Non-agents (Super Admin, Warehouse Staff, Documentation Staff) are not port-restricted
  if (user.roleKey !== ROLES.PORT_AGENT) {
    return;
  }

  const agentPortCode = user.destinationPortCode || 'NAS';

  // If request contains a port parameter, query, or body, check compatibility
  const params = request.params as Record<string, unknown> | undefined;
  const query = request.query as Record<string, unknown> | undefined;
  const body = request.body as Record<string, unknown> | undefined;

  // Auto-scope query for listing endpoints if not explicitly set
  if (query && !query.destinationCode) {
    query.destinationCode = agentPortCode;
  }

  // For POST/PUT/PATCH requests, auto-assign the agent's port code if missing
  if (body && !body.destinationCode) {
    body.destinationCode = agentPortCode;
  }

  const targetPortCode =
    (params?.destinationCode as string) ||
    (params?.portCode as string) ||
    (query?.destinationCode as string) ||
    (query?.portCode as string) ||
    (body?.destinationCode as string);

  if (targetPortCode && targetPortCode !== 'All' && targetPortCode.toUpperCase() !== agentPortCode.toUpperCase()) {
    throw new AppError(
      `Forbidden: Agent is restricted to assigned port '${agentPortCode}' and cannot access or modify records for '${targetPortCode}'`,
      403,
      true
    );
  }
}
