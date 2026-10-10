import { eq, ilike, or, count, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import { CreateUserInput, UpdateUserInput } from './users.types.js';

export class UsersRepository {
  async findMany(filters: { search?: string; role?: string; status?: string; limit: number; offset: number }) {
    const conditions = [];

    if (filters.role) {
      conditions.push(eq(users.roleKey, filters.role));
    }
    if (filters.status) {
      conditions.push(eq(users.status, filters.status));
    }
    if (filters.search) {
      conditions.push(
        or(
          ilike(users.name, `%${filters.search}%`),
          ilike(users.email, `%${filters.search}%`),
          ilike(users.userCode, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select({
        id: users.id,
        userCode: users.userCode,
        name: users.name,
        email: users.email,
        roleKey: users.roleKey,
        department: users.department,
        status: users.status,
        avatar: users.avatar,
        phone: users.phone,
        lastLogin: users.lastLogin,
        agentId: users.agentId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .limit(filters.limit)
      .offset(filters.offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(whereClause);

    return { data, total: Number(total) };
  }

  async findById(id: string) {
    const result = await db
      .select({
        id: users.id,
        userCode: users.userCode,
        name: users.name,
        email: users.email,
        roleKey: users.roleKey,
        department: users.department,
        status: users.status,
        avatar: users.avatar,
        phone: users.phone,
        lastLogin: users.lastLogin,
        agentId: users.agentId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0] || null;
  }

  async findByEmail(email: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    return result[0] || null;
  }

  async create(data: Omit<CreateUserInput, 'password'> & { passwordHash: string; userCode: string }) {
    const [created] = await db
      .insert(users)
      .values(data as any)
      .returning();

    return created;
  }

  async update(id: string, data: Omit<UpdateUserInput, 'password'> & { passwordHash?: string }) {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(users.id, id))
      .returning();

    return updated || null;
  }

  async delete(id: string) {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    return !!deleted;
  }
}

export const usersRepository = new UsersRepository();
