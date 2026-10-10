import { eq, ilike, or, count, and, desc, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { houseBills, NewHouseBill, settings } from '../../db/schema/index.js';
import { HouseBillFilterParams } from './house-bills.types.js';

export class HouseBillsRepository {
  async findMany(filters: HouseBillFilterParams) {
    const conditions = [];

    if (filters.status && filters.status !== 'All') {
      conditions.push(ilike(houseBills.status, filters.status));
    }
    if (filters.destinationCode && filters.destinationCode !== 'All') {
      conditions.push(eq(houseBills.destinationCode, filters.destinationCode));
    }
    if (filters.customerId && filters.customerId !== 'All') {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.customerId);
      if (isUuid) {
        conditions.push(eq(houseBills.customerId, filters.customerId));
      } else {
        conditions.push(ilike(houseBills.customerName, `%${filters.customerId}%`));
      }
    }
    if (filters.search) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(houseBills.hblNumber, q),
          ilike(houseBills.customerName, q),
          ilike(houseBills.cargoDescription, q),
          ilike(houseBills.destinationPort, q),
          sql`${houseBills.shipper}::text ILIKE ${q}`,
          sql`${houseBills.consignee}::text ILIKE ${q}`,
          sql`${houseBills.warehouseReceiptIds}::text ILIKE ${q}`
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(houseBills)
      .where(whereClause)
      .orderBy(desc(houseBills.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(houseBills)
      .where(whereClause);

    return { data, total: Number(total) };
  }

  async findByIdOrHblNumber(idOrHblNumber: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrHblNumber);
    const condition = isUuid
      ? or(eq(houseBills.id, idOrHblNumber), eq(houseBills.hblNumber, idOrHblNumber))
      : eq(houseBills.hblNumber, idOrHblNumber);

    const result = await db
      .select()
      .from(houseBills)
      .where(condition)
      .limit(1);

    return result[0] || null;
  }

  async countTotal() {
    const [{ total }] = await db.select({ total: count() }).from(houseBills);
    return Number(total);
  }

  async getNextHblNumber(): Promise<string> {
    const existing = await db
      .select({ hblNumber: houseBills.hblNumber })
      .from(houseBills);

    let maxSeq = 0;
    const existingSet = new Set<string>();

    for (const row of existing) {
      if (row.hblNumber) {
        existingSet.add(row.hblNumber.trim());
        const match = row.hblNumber.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    }

    let next = maxSeq + 1;
    const setting = await db.select().from(settings).where(eq(settings.key, 'numberingRules')).limit(1);
    const configuredPrefix = (setting[0]?.value as any)?.houseBillPrefix?.trim() || 'HBL-2026-';
    const prefix = configuredPrefix.endsWith('-') ? configuredPrefix : `${configuredPrefix}-`;

    let candidate = `${prefix}${String(next).padStart(4, '0')}`;
    while (existingSet.has(candidate)) {
      next++;
      candidate = `${prefix}${String(next).padStart(4, '0')}`;
    }

    return candidate;
  }

  async create(data: NewHouseBill) {
    const [created] = await db.insert(houseBills).values(data).returning();
    return created;
  }

  async update(id: string, data: any) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const condition = isUuid
      ? or(eq(houseBills.id, id), eq(houseBills.hblNumber, id))
      : eq(houseBills.hblNumber, id);

    const [updated] = await db
      .update(houseBills)
      .set({ ...data, updatedAt: new Date() })
      .where(condition)
      .returning();
    return updated || null;
  }

  async delete(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const condition = isUuid
      ? or(eq(houseBills.id, id), eq(houseBills.hblNumber, id))
      : eq(houseBills.hblNumber, id);

    const [deleted] = await db
      .delete(houseBills)
      .where(condition)
      .returning();
    return !!deleted;
  }
}



export const houseBillsRepository = new HouseBillsRepository();
