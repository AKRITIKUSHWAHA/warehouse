import { sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  customers,
  warehouseReceipts,
  cargo,
  houseBills,
  consolidations,
  vessels,
  shipments,
  billsOfLading,
  manifests,
  users,
  ports,
  auditLogs,
} from '../../db/schema/index.js';

export class AdminRepository {
  async getDashboardMetrics() {
    // Perform efficient count queries in parallel
    const [
      customersCount,
      wrCount,
      cargoCount,
      hblCount,
      consolidationCount,
      vesselsCount,
      shipmentsCount,
      mblCount,
      holdsCount,
      manifestsCount,
      usersCount,
      portsCount,
      recentAuditLogs,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(customers),
      db.select({ count: sql<number>`count(*)::int` }).from(warehouseReceipts),
      db.select({ count: sql<number>`count(*)::int` }).from(cargo),
      db.select({ count: sql<number>`count(*)::int` }).from(houseBills),
      db.select({ count: sql<number>`count(*)::int` }).from(consolidations),
      db.select({ count: sql<number>`count(*)::int` }).from(vessels),
      db.select({ count: sql<number>`count(*)::int` }).from(shipments),
      db.select({ count: sql<number>`count(*)::int` }).from(billsOfLading),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(billsOfLading)
        .where(sql`status = 'On Hold'`),
      db.select({ count: sql<number>`count(*)::int` }).from(manifests),
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db.select({ count: sql<number>`count(*)::int` }).from(ports),
      db
        .select()
        .from(auditLogs)
        .orderBy(sql`created_at DESC`)
        .limit(5),
    ]);

    return {
      totalCustomers: customersCount[0]?.count || 0,
      totalWarehouseReceipts: wrCount[0]?.count || 0,
      totalCargoUnits: cargoCount[0]?.count || 0,
      totalHouseBills: hblCount[0]?.count || 0,
      totalConsolidations: consolidationCount[0]?.count || 0,
      totalVessels: vesselsCount[0]?.count || 0,
      totalShipments: shipmentsCount[0]?.count || 0,
      totalBillsOfLading: mblCount[0]?.count || 0,
      activeHoldsCount: holdsCount[0]?.count || 0,
      totalManifests: manifestsCount[0]?.count || 0,
      totalUsers: usersCount[0]?.count || 0,
      totalPorts: portsCount[0]?.count || 0,
      recentActivity: recentAuditLogs,
    };
  }
}

export const adminRepository = new AdminRepository();
