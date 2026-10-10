import { RoleType } from '../../common/constants/roles.js';

export interface UserSummary {
  id: string;
  userCode?: string | null;
  name: string;
  email: string;
  roleKey: RoleType;
  department?: string | null;
  status: string;
  avatar?: string | null;
  phone?: string | null;
  lastLogin?: string | null;
  createdAt: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roleKey: RoleType;
  department?: string;
  phone?: string;
  status?: string;
  agentId?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  roleKey?: RoleType;
  department?: string;
  phone?: string;
  status?: string;
  agentId?: string;
}
