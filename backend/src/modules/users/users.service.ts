import bcrypt from 'bcryptjs';
import { UsersRepository, usersRepository } from './users.repository.js';
import { CreateUserInput, UpdateUserInput } from './users.types.js';
import { AppError } from '../../common/errors/app-error.js';
import { NotFoundError } from '../../common/errors/not-found-error.js';

export class UsersService {
  constructor(private readonly repo: UsersRepository = usersRepository) {}

  async listUsers(filters: { search?: string; role?: string; status?: string; limit: number; offset: number }) {
    return this.repo.findMany(filters);
  }

  async getUserById(id: string) {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  async createUser(input: CreateUserInput) {
    const existing = await this.repo.findByEmail(input.email);
    if (existing) {
      throw new AppError('A user with this email address already exists', 400, true);
    }

    const { password, ...userData } = input;
    const passwordHash = await bcrypt.hash(password, 10);
    const userCode = `USR-${Math.floor(100 + Math.random() * 900)}`;

    return this.repo.create({
      ...userData,
      userCode,
      passwordHash,
    });
  }

  async updateUser(id: string, input: UpdateUserInput) {
    await this.getUserById(id);
    const { password, ...updateData } = input;
    let passwordHash: string | undefined = undefined;
    if (password && password.trim().length >= 6) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }
    return this.repo.update(id, {
      ...updateData,
      ...(passwordHash ? { passwordHash } : {}),
    });
  }

  async deleteUser(id: string) {
    const user = await this.getUserById(id);
    if (user.roleKey === 'super_admin') {
      const allSuperAdmins = await this.repo.findMany({ role: 'super_admin', status: 'Active', limit: 10, offset: 0 });
      if (allSuperAdmins.total <= 1) {
        throw new AppError('Cannot delete or deactivate the last active Super Admin account', 400, true);
      }
    }
    return this.repo.delete(id);
  }
}

export const usersService = new UsersService();
