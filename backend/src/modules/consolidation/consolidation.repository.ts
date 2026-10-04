import { eq, ilike, or, count, and, desc, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { consolidations, NewConsolidation } from '../../db/schema/index.js';
import { ConsolidationFilterParams } from './consolidation.types.js';

export class ConsolidationRepository {
  async findMany(filters: ConsolidationFilterParams) {
    const conditions = [];

    if (filters.status && filters.status !== 'All') {
      conditions.push(ilike(consolidations.status, filters.status));
    }
    if (filters.destinationCode && filters.destinationCode !== 'All') {
      conditions.push(eq(consolidations.destinationCode, filters.destinationCode));
    }
    if (filters.search) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(consolidations.consolidationNumber, q),
          ilike(consolidations.title, q),
          ilike(consolidations.destinationPort, q),
          ilike(consolidations.containerNumber, q),
          ilike(consolidations.sealNumber, q),
          ilike(consolidations.vesselName, q),
          ilike(consolidations.voyageNumber, q),
          ilike(consolidations.carrier, q),
          sql`${consolidations.receiptIds}::text ILIKE ${q}`,
          sql`${consolidations.houseBillIds}::text ILIKE ${q}`
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(consolidations)
      .where(whereClause)
      .orderBy(desc(consolidations.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(consolidations)
      .where(whereClause);

    return { data, total: Number(total) };
  }

  async findByIdOrNumber(idOrNumber: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
    const condition = isUuid
      ? or(eq(consolidations.id, idOrNumber), eq(consolidations.consolidationNumber, idOrNumber))
      : eq(consolidations.consolidationNumber, idOrNumber);

    const result = await db
      .select()
      .from(consolidations)
      .where(condition)
      .limit(1);

    return result[0] || null;
  }

  async countTotal(): Promise<number> {
    const [{ total }] = await db.select({ total: count() }).from(consolidations);
    return Number(total);
  }

  async create(data: NewConsolidation) {
    const [created] = await db
      .insert(consolidations)
      .values(data)
      .returning();

    return created;
  }

  async update(id: string, data: Partial<NewConsolidation>) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const condition = isUuid
      ? or(eq(consolidations.id, id), eq(consolidations.consolidationNumber, id))
      : eq(consolidations.consolidationNumber, id);

    const [updated] = await db
      .update(consolidations)
      .set({ ...data, updatedAt: new Date() })
      .where(condition)
      .returning();

    return updated || null;
  }

  async delete(id: string): Promise<boolean> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const condition = isUuid
      ? or(eq(consolidations.id, id), eq(consolidations.consolidationNumber, id))
      : eq(consolidations.consolidationNumber, id);

    const [deleted] = await db
      .delete(consolidations)
      .where(condition)
      .returning();

    return !!deleted;
  }
}

export const consolidationRepository = new ConsolidationRepository();

