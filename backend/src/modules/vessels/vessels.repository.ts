import { eq, ilike, or, count, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { vessels } from '../../db/schema/index.js';
import { VesselFilterParams } from './vessels.types.js';

export class VesselsRepository {
  async findMany(filters: VesselFilterParams) {
    const conditions = [];

    if (filters.search) {
      conditions.push(
        or(
          ilike(vessels.name, `%${filters.search}%`),
          ilike(vessels.carrier, `%${filters.search}%`),
          ilike(vessels.type, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(vessels)
      .where(whereClause)
      .limit(filters.limit)
      .offset(filters.offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(vessels)
      .where(whereClause);

    return { data, total: Number(total) };
  }

  async findById(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      const byName = await db.select().from(vessels).where(ilike(vessels.name, id)).limit(1);
      return byName[0] || null;
    }
    const result = await db.select().from(vessels).where(eq(vessels.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: Record<string, unknown>) {
    const insertData: any = {
      name: data.name,
      type: data.type || 'Container Vessel',
      notes: data.notes || '',
      carrier: data.carrier || ''
    };
    if (typeof data.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id)) {
      insertData.id = data.id;
    }

    const [created] = await db.insert(vessels).values(insertData).returning();
    return created;
  }

  async update(id: string, data: Record<string, unknown>) {
    const updateData: any = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.carrier !== undefined) updateData.carrier = data.carrier;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const condition = isUuid ? eq(vessels.id, id) : ilike(vessels.name, id);

    const [updated] = await db.update(vessels).set(updateData).where(condition).returning();
    return updated || null;
  }

  async delete(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const condition = isUuid ? eq(vessels.id, id) : ilike(vessels.name, id);

    const [deleted] = await db.delete(vessels).where(condition).returning();
    return !!deleted;
  }
}


export const vesselsRepository = new VesselsRepository();
