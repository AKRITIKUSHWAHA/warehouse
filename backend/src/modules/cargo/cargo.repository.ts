import { eq, ilike, or, count, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { cargo } from '../../db/schema/index.js';
import { CargoFilterParams } from './cargo.types.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CargoRepository {
  async findMany(filters: CargoFilterParams) {
    const conditions = [];

    if (filters.status && filters.status !== 'All') {
      conditions.push(eq(cargo.status, filters.status));
    }
    if (filters.destinationCode && filters.destinationCode !== 'All') {
      conditions.push(eq(cargo.destinationCode, filters.destinationCode));
    }
    if (filters.agentId && UUID_REGEX.test(filters.agentId)) {
      conditions.push(eq(cargo.agentId, filters.agentId));
    }
    if (filters.warehouseReceiptId && UUID_REGEX.test(filters.warehouseReceiptId)) {
      conditions.push(eq(cargo.warehouseReceiptId, filters.warehouseReceiptId));
    }
    if (filters.search) {
      const searchTerms = [
        ilike(cargo.cargoNumber, `%${filters.search}%`),
        ilike(cargo.receiptNumber, `%${filters.search}%`),
        ilike(cargo.customer, `%${filters.search}%`),
        ilike(cargo.description, `%${filters.search}%`),
        ilike(cargo.destinationPort, `%${filters.search}%`),
        ilike(cargo.warehouseLocation, `%${filters.search}%`),
      ];
      if (UUID_REGEX.test(filters.search)) {
        searchTerms.push(eq(cargo.id, filters.search));
      }
      conditions.push(or(...searchTerms));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(cargo)
      .where(whereClause)
      .orderBy(desc(cargo.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(cargo)
      .where(whereClause);

    return { data, total: Number(total) };
  }

  async findById(id: string) {
    const isUuid = UUID_REGEX.test(id);
    const matchCondition = isUuid ? or(eq(cargo.id, id), eq(cargo.cargoNumber, id)) : eq(cargo.cargoNumber, id);
    const result = await db
      .select()
      .from(cargo)
      .where(matchCondition)
      .limit(1);
    return result[0] || null;
  }

  async create(data: Record<string, unknown>) {
    const [created] = await db.insert(cargo).values(data as any).returning();
    return created;
  }

  async update(id: string, data: Record<string, unknown>) {
    const isUuid = UUID_REGEX.test(id);
    const matchCondition = isUuid ? or(eq(cargo.id, id), eq(cargo.cargoNumber, id)) : eq(cargo.cargoNumber, id);
    const [updated] = await db
      .update(cargo)
      .set({
        ...data,
        updatedAt: new Date(),
      } as any)
      .where(matchCondition)
      .returning();
    return updated || null;
  }

  async delete(id: string) {
    const isUuid = UUID_REGEX.test(id);
    const matchCondition = isUuid ? or(eq(cargo.id, id), eq(cargo.cargoNumber, id)) : eq(cargo.cargoNumber, id);
    const [deleted] = await db
      .delete(cargo)
      .where(matchCondition)
      .returning();
    return !!deleted;
  }
}

export const cargoRepository = new CargoRepository();
