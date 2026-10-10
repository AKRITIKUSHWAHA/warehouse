import bcrypt from 'bcryptjs';
import { AuthRepository, authRepository } from './auth.repository.js';
import { LoginInput, LoginResponse, AuthUserResponse } from './auth.types.js';
import { AppError } from '../../common/errors/app-error.js';
import { RoleType } from '../../common/constants/roles.js';

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) {}

  async validateCredentials(input: LoginInput): Promise<AuthUserResponse> {
    const user = await this.repo.findUserByEmail(input.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401, true);
    }

    if (user.status !== 'Active') {
      throw new AppError('This user account is inactive. Please contact system administrator.', 403, true);
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(input.password, user.passwordHash);
    } catch {
      isMatch = false;
    }

    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, true);
    }

    return {
      id: user.id,
      userCode: user.userCode,
      name: user.name,
      email: user.email,
      roleKey: user.roleKey as RoleType,
      department: user.department,
      avatar: user.avatar,
      status: user.status,
      agentId: user.agentId,
      destinationPortCode: user.assignedPortCode,
    };
  }

  async getMe(userId: string): Promise<AuthUserResponse> {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404, true);
    }

    return {
      id: user.id,
      userCode: user.userCode,
      name: user.name,
      email: user.email,
      roleKey: user.roleKey as RoleType,
      department: user.department,
      avatar: user.avatar,
      status: user.status,
      agentId: user.agentId,
      destinationPortCode: user.assignedPortCode,
    };
  }

  async switchUser(userIdOrEmail: string): Promise<AuthUserResponse> {
    let user = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdOrEmail);
    if (isUuid) {
      user = await this.repo.findUserById(userIdOrEmail);
    }
    if (!user) {
      user = await this.repo.findUserByEmail(userIdOrEmail);
    }
    if (!user) {
      throw new AppError('User account not found', 404, true);
    }

    return {
      id: user.id,
      userCode: user.userCode,
      name: user.name,
      email: user.email,
      roleKey: user.roleKey as RoleType,
      department: user.department,
      avatar: user.avatar,
      status: user.status,
      agentId: user.agentId,
      destinationPortCode: user.assignedPortCode,
    };
  }
}

export const authService = new AuthService();
