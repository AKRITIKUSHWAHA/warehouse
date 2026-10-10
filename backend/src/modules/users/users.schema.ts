import { z } from 'zod';
import { ROLES, RoleType } from '../../common/constants/roles.js';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  roleKey: z.enum(['super_admin', 'operations', 'warehouse', 'documentation', 'agent']),
  department: z.string().optional(),
  phone: z.string().optional(),
  agentId: z.string().uuid().optional(),
  status: z.string().optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
  status: z.string().optional(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  role: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});
