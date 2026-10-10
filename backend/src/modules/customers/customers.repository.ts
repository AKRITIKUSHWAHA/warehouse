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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const condition = isUuid
      ? or(eq(customers.id, id), eq(customers.customerNumber, id))
      : eq(customers.customerNumber, id);

    const result = await db
      .select()
      .from(customers)
      .where(condition)
      .limit(1);

    return result[0] || null;
  }

  async countTotal() {
    const [{ total }] = await db.select({ total: count() }).from(customers);
    return Number(total);
  }

  async getNextCustomerNumber(): Promise<string> {
    const existing = await db
      .select({ customerNumber: customers.customerNumber })
      .from(customers);

    let maxSeq = 0;
    const existingSet = new Set<string>();

    for (const row of existing) {
      if (row.customerNumber) {
        existingSet.add(row.customerNumber.trim());
        const match = row.customerNumber.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    }

    let next = maxSeq + 1;
    let candidate = `CUS-2026-${String(next).padStart(4, '0')}`;
    while (existingSet.has(candidate)) {
      next++;
      candidate = `CUS-2026-${String(next).padStart(4, '0')}`;
    }

    return candidate;
  }

  async create(data: CreateCustomerInput & { customerNumber: string; createdDate: string }) {
    const [created] = await db
      .insert(customers)
      .values(data)
      .returning();

    return created;
  }

  async update(id: string, data: UpdateCustomerInput) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const condition = isUuid
      ? or(eq(customers.id, id), eq(customers.customerNumber, id))
      : eq(customers.customerNumber, id);

    const [updated] = await db
      .update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(condition)
      .returning();

    return updated || null;
  }

  async delete(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const condition = isUuid
      ? or(eq(customers.id, id), eq(customers.customerNumber, id))
      : eq(customers.customerNumber, id);

    const [deleted] = await db
      .delete(customers)
      .where(condition)
      .returning();

    return !!deleted;
  }
}

export const customersRepository = new CustomersRepository();
