import { eq, ilike, or, count, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { voyages } from '../../db/schema/index.js';
import { VoyageFilterParams } from './voyages.types.js';

export class VoyagesRepository {
  async findMany(filters: VoyageFilterParams) {
    const conditions = [];

    if (filters.status && filters.status !== 'All') {
      conditions.push(eq(voyages.status, filters.status));
    }
    if (filters.search) {
      conditions.push(
        or(
          ilike(voyages.voyageNumber, `%${filters.search}%`),
          ilike(voyages.vesselName, `%${filters.search}%`),
          ilike(voyages.carrier, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(voyages)
      .where(whereClause)
      .limit(filters.limit)
      .offset(filters.offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(voyages)
      .where(whereClause);

    return { data, total: Number(total) };
  }

  async findByIdOrNumber(idOrNumber: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
    const condition = isUuid
      ? or(eq(voyages.id, idOrNumber), eq(voyages.voyageNumber, idOrNumber))
      : eq(voyages.voyageNumber, idOrNumber);

    const result = await db
      .select()
      .from(voyages)
      .where(condition)
      .limit(1);

    return result[0] || null;
  }

  async create(data: Record<string, unknown>) {
    const isUuid = typeof data.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id);
    const insertData: any = { ...data };
    if (!isUuid) delete insertData.id;
    if (insertData.assignedShipmentsCount !== undefined) {
      insertData.assignedShipmentsCount = Number(insertData.assignedShipmentsCount);
    }
    if (insertData.totalTeuUtilized !== undefined) {
      insertData.totalTeuUtilized = String(insertData.totalTeuUtilized);
    }

    const [created] = await db.insert(voyages).values(insertData).returning();
    return created;
  }

  async update(idOrNumber: string, data: Record<string, unknown>) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
    const condition = isUuid
      ? or(eq(voyages.id, idOrNumber), eq(voyages.voyageNumber, idOrNumber))
      : eq(voyages.voyageNumber, idOrNumber);

    const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };
    delete updateData.id;
    if (updateData.assignedShipmentsCount !== undefined) {
      updateData.assignedShipmentsCount = Number(updateData.assignedShipmentsCount);
    }
    if (updateData.totalTeuUtilized !== undefined) {
      updateData.totalTeuUtilized = String(updateData.totalTeuUtilized);
    }

    const [updated] = await db.update(voyages).set(updateData).where(condition).returning();
    return updated || null;
  }

  async delete(idOrNumber: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
    const condition = isUuid
      ? or(eq(voyages.id, idOrNumber), eq(voyages.voyageNumber, idOrNumber))
      : eq(voyages.voyageNumber, idOrNumber);

    const [deleted] = await db.delete(voyages).where(condition).returning();
    return !!deleted;
  }
}

export const voyagesRepository = new VoyagesRepository();
