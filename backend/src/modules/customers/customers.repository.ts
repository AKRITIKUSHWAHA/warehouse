import { eq, ilike, or, count, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { customers } from '../../db/schema/index.js';
import { CustomerFilterParams, CreateCustomerInput, UpdateCustomerInput } from './customers.types.js';

export class CustomersRepository {
  async findMany(filters: CustomerFilterParams) {
    const conditions = [];

    if (filters.destinationCode) {
      conditions.push(eq(customers.destinationCode, filters.destinationCode));
    }
    if (filters.status) {
      conditions.push(eq(customers.status, filters.status));
    }
    if (filters.search) {
      conditions.push(
        or(
          ilike(customers.name, `%${filters.search}%`),
          ilike(customers.companyName, `%${filters.search}%`),
          ilike(customers.customerNumber, `%${filters.search}%`),
          ilike(customers.destinationPort, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(customers)
      .where(whereClause)
      .limit(filters.limit)
      .offset(filters.offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(customers)
      .where(whereClause);

    return { data, total: Number(total) };
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(customers)
      .where(or(eq(customers.id, id), eq(customers.customerNumber, id)))
      .limit(1);

    return result[0] || null;
  }

  async countTotal() {
    const [{ total }] = await db.select({ total: count() }).from(customers);
    return Number(total);
  }

  async getNextCustomerNumber(): Promise<string> {
    const total = await this.countTotal();
    const nextSeq = String(total + 1).padStart(4, '0');
    return `CUS-2026-${nextSeq}`;
  }

  async create(data: CreateCustomerInput & { customerNumber: string; createdDate: string }) {
    const [created] = await db
      .insert(customers)
      .values(data)
      .returning();

    return created;
  }

  async update(id: string, data: UpdateCustomerInput) {
    const [updated] = await db
      .update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(or(eq(customers.id, id), eq(customers.customerNumber, id)))
      .returning();

    return updated || null;
  }

  async delete(id: string) {
    const [deleted] = await db
      .delete(customers)
      .where(or(eq(customers.id, id), eq(customers.customerNumber, id)))
      .returning();

    return !!deleted;
  }
}

export const customersRepository = new CustomersRepository();
