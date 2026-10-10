import { eq, ilike, or, count, and, desc, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { billsOfLading, NewBillOfLading, HoldDetails, houseBills, shipments } from '../../db/schema/index.js';
import { BillOfLadingFilterParams } from './bills-of-lading.types.js';

export class BillsOfLadingRepository {
  async findMany(filters: BillOfLadingFilterParams) {
    const conditions = [];

    if (filters.status && filters.status !== 'All') {
      conditions.push(eq(billsOfLading.status, filters.status));
    }
    if (filters.agentId && filters.agentId !== 'All') {
      conditions.push(eq(billsOfLading.agentId, filters.agentId));
    }
    if (filters.search) {
      conditions.push(
        or(
          ilike(billsOfLading.blNumber, `%${filters.search}%`),
          ilike(billsOfLading.shipmentNumber, `%${filters.search}%`),
          ilike(billsOfLading.containerNumber, `%${filters.search}%`),
          ilike(billsOfLading.oceanVessel, `%${filters.search}%`),
          ilike(billsOfLading.cargoDescription, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(billsOfLading)
      .where(whereClause)
      .orderBy(desc(billsOfLading.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(billsOfLading)
      .where(whereClause);

    return { data, total: Number(total) };
  }

  async findByIdOrNumber(idOrNumber: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
    const whereCondition = isUuid
      ? or(eq(billsOfLading.id, idOrNumber), eq(billsOfLading.blNumber, idOrNumber), eq(billsOfLading.shipmentId, idOrNumber))
      : or(eq(billsOfLading.blNumber, idOrNumber), eq(billsOfLading.shipmentNumber, idOrNumber), eq(billsOfLading.containerNumber, idOrNumber));

    const result = await db
      .select()
      .from(billsOfLading)
      .where(whereCondition)
      .limit(1);

    const bl = result[0];
    if (!bl) return null;

    // Fetch linked house bills
    const hblConditions = [
      eq(houseBills.assignedMasterBLId, bl.id),
      eq(houseBills.assignedMasterBLId, bl.blNumber),
    ];
    if (Array.isArray(bl.houseBillIds) && bl.houseBillIds.length > 0) {
      const validHblUuids = bl.houseBillIds.filter((hId: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hId));
      if (validHblUuids.length > 0) {
        hblConditions.push(inArray(houseBills.id, validHblUuids));
      }
      hblConditions.push(inArray(houseBills.hblNumber, bl.houseBillIds));
    }

    const linkedHBLs = await db
      .select()
      .from(houseBills)
      .where(or(...hblConditions))
      .catch(() => []);

    // Fetch linked shipment
    let linkedShipment: any = null;
    const shipmentConditions = [
      eq(shipments.billOfLadingId, bl.id),
      eq(shipments.billOfLadingNumber, bl.blNumber),
    ];
    if (bl.shipmentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bl.shipmentId)) {
      shipmentConditions.push(eq(shipments.id, bl.shipmentId));
    }
    if (bl.shipmentNumber) {
      shipmentConditions.push(eq(shipments.shipmentNumber, bl.shipmentNumber));
    }

    const shipResult = await db
      .select()
      .from(shipments)
      .where(or(...shipmentConditions))
      .limit(1)
      .catch(() => []);

    if (shipResult.length > 0) {
      linkedShipment = shipResult[0];
    }

    return {
      ...bl,
      oceanVessel: bl.oceanVessel || linkedShipment?.vesselName || 'M/V Caribbean Voyager',
      voyageNumber: bl.voyageNumber || linkedShipment?.voyageNumber || 'VOY-2026-088',
      carrier: bl.carrier || linkedShipment?.carrier || 'Tropical Shipping',
      containerNumber: bl.containerNumber || linkedShipment?.containerNumber || '',
      sealNumber: bl.sealNumber || linkedShipment?.sealNumber || '',
      containerType: bl.containerType || linkedShipment?.containerType || "40' High Cube",
      shipmentNumber: bl.shipmentNumber || linkedShipment?.shipmentNumber || null,
      shipmentId: bl.shipmentId || linkedShipment?.id || null,
      linkedHouseBills: linkedHBLs || [],
      linkedShipment: linkedShipment || null,
    };
  }

  async countTotal(): Promise<number> {
    const [{ total }] = await db.select({ total: count() }).from(billsOfLading);
    return Number(total);
  }

  async getNextBlNumber(): Promise<string> {
    const existing = await db
      .select({ blNumber: billsOfLading.blNumber })
      .from(billsOfLading);

    let maxSeq = 0;
    const existingSet = new Set<string>();

    for (const row of existing) {
      if (row.blNumber) {
        existingSet.add(row.blNumber.trim());
        const match = row.blNumber.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    }

    let next = maxSeq + 1;
    let candidate = `BL-VI-2026-${String(next).padStart(4, '0')}`;
    while (existingSet.has(candidate)) {
      next++;
      candidate = `BL-VI-2026-${String(next).padStart(4, '0')}`;
    }

    return candidate;
  }


  async updateHoldStatus(id: string, status: string, holdDetails: HoldDetails) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const whereCondition = isUuid
      ? or(eq(billsOfLading.id, id), eq(billsOfLading.blNumber, id))
      : eq(billsOfLading.blNumber, id);

    const [updated] = await db
      .update(billsOfLading)
      .set({
        status,
        holdDetails,
        updatedAt: new Date(),
      })
      .where(whereCondition)
      .returning();

    return updated || null;
  }

  async create(data: Partial<typeof billsOfLading.$inferInsert>) {
    const [created] = await db
      .insert(billsOfLading)
      .values(data as any)
      .returning();
    return created;
  }

  async update(idOrNumber: string, data: Partial<typeof billsOfLading.$inferInsert>) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
    const whereCondition = isUuid
      ? or(eq(billsOfLading.id, idOrNumber), eq(billsOfLading.blNumber, idOrNumber))
      : eq(billsOfLading.blNumber, idOrNumber);

    const [updated] = await db
      .update(billsOfLading)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(whereCondition)
      .returning();

    return updated || null;
  }

  async delete(idOrNumber: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
    const whereCondition = isUuid
      ? or(eq(billsOfLading.id, idOrNumber), eq(billsOfLading.blNumber, idOrNumber))
      : eq(billsOfLading.blNumber, idOrNumber);

    const [deleted] = await db
      .delete(billsOfLading)
      .where(whereCondition)
      .returning();

    return !!deleted;
  }
}


export const billsOfLadingRepository = new BillsOfLadingRepository();
