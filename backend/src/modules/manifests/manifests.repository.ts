import { eq, ilike, or, count, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { manifests, NewManifest } from '../../db/schema/index.js';
import { ManifestFilterParams } from './manifests.types.js';

export class ManifestsRepository {
  async findMany(filters: ManifestFilterParams) {
    const conditions = [];

    if (filters.status && filters.status !== 'All') {
      conditions.push(eq(manifests.status, filters.status));
    }
    if (filters.search) {
      conditions.push(
        or(
          ilike(manifests.manifestNumber, `%${filters.search}%`),
          ilike(manifests.title, `%${filters.search}%`),
          ilike(manifests.vesselName, `%${filters.search}%`),
          ilike(manifests.portOfDischarge, `%${filters.search}%`),
          ilike(manifests.portOfLoading, `%${filters.search}%`),
          ilike(manifests.carrier, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(manifests)
      .where(whereClause)
      .orderBy(desc(manifests.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(manifests)
      .where(whereClause);

    return { data, total: Number(total) };
  }

  async findByIdOrNumber(idOrNumber: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
    const whereCondition = isUuid
      ? or(eq(manifests.id, idOrNumber), eq(manifests.manifestNumber, idOrNumber))
      : eq(manifests.manifestNumber, idOrNumber);

    const result = await db
      .select()
      .from(manifests)
      .where(whereCondition)
      .limit(1);

    return result[0] || null;
  }

  async countTotal(): Promise<number> {
    const [{ total }] = await db.select({ total: count() }).from(manifests);
    return Number(total);
  }

  async create(data: NewManifest) {
    const [created] = await db
      .insert(manifests)
      .values(data)
      .returning();

    return created;
  }

  async update(idOrNumber: string, data: Partial<NewManifest>) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
    const whereCondition = isUuid
      ? or(eq(manifests.id, idOrNumber), eq(manifests.manifestNumber, idOrNumber))
      : eq(manifests.manifestNumber, idOrNumber);

    const [updated] = await db
      .update(manifests)
      .set({ ...data, updatedAt: new Date() })
      .where(whereCondition)
      .returning();

    return updated || null;
  }

  async delete(idOrNumber: string): Promise<boolean> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
    const whereCondition = isUuid
      ? or(eq(manifests.id, idOrNumber), eq(manifests.manifestNumber, idOrNumber))
      : eq(manifests.manifestNumber, idOrNumber);

    const [deleted] = await db
      .delete(manifests)
      .where(whereCondition)
      .returning();

    return !!deleted;
  }
}

export const manifestsRepository = new ManifestsRepository();
