import { eq, ilike, or, and, desc, sql, gte, lte } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { shipments, warehouseReceipts, billsOfLading, containers } from '../../db/schema/index.js';
import { ShipmentHistoryFilterParams } from './history.types.js';

export class HistoryRepository {
  async findShipments(filters: ShipmentHistoryFilterParams) {
    const conditions = [];

    if (filters.status && filters.status !== 'All') {
      const st = filters.status.toLowerCase();
      if (st.includes('deliver')) {
        conditions.push(or(eq(shipments.status, 'Delivered'), ilike(shipments.status, '%deliver%')));
      } else if (st.includes('transit')) {
        conditions.push(ilike(shipments.status, '%transit%'));
      } else if (st.includes('loaded') || st.includes('seal')) {
        conditions.push(or(ilike(shipments.status, '%loaded%'), ilike(shipments.status, '%seal%')));
      } else if (st.includes('received')) {
        conditions.push(ilike(shipments.status, '%received%'));
      } else if (st.includes('consolidat')) {
        conditions.push(ilike(shipments.status, '%consolidat%'));
      } else {
        conditions.push(ilike(shipments.status, `%${filters.status}%`));
      }
    }

    if (filters.destinationCode && filters.destinationCode !== 'All') {
      conditions.push(eq(shipments.destinationCode, filters.destinationCode));
    }

    if (filters.dateFrom) {
      conditions.push(gte(shipments.createdDate, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(shipments.createdDate, filters.dateTo));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(shipments.shipmentNumber, `%${filters.search}%`),
          ilike(shipments.trackingNumber, `%${filters.search}%`),
          ilike(shipments.containerNumber, `%${filters.search}%`),
          ilike(shipments.vesselName, `%${filters.search}%`),
          ilike(shipments.voyageNumber, `%${filters.search}%`),
          ilike(shipments.billOfLadingNumber, `%${filters.search}%`),
          ilike(shipments.destinationPort, `%${filters.search}%`),
          ilike(shipments.origin, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(shipments)
      .where(whereClause)
      .orderBy(desc(shipments.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    // Fetch all matching without pagination for total count and metrics
    const allMatching = await db
      .select()
      .from(shipments)
      .where(whereClause);

    return {
      data,
      total: allMatching.length,
      allMatching,
    };
  }

  async findById(idOrNumber: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNumber);
    const result = await db
      .select()
      .from(shipments)
      .where(
        isUuid
          ? or(eq(shipments.id, idOrNumber), eq(shipments.shipmentNumber, idOrNumber))
          : or(eq(shipments.shipmentNumber, idOrNumber), eq(shipments.trackingNumber, idOrNumber))
      )
      .limit(1);

    return result[0] || null;
  }
}

export const historyRepository = new HistoryRepository();
