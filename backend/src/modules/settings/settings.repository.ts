import { eq, sql, count } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { settings, auditLogs } from '../../db/schema/index.js';

export class SettingsRepository {
  async findAll() {
    return db.select().from(settings);
  }

  async findByKey(key: string) {
    const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return result[0] || null;
  }

  async upsert(key: string, value: Record<string, unknown>, description?: string) {
    const [saved] = await db
      .insert(settings)
      .values({ key, value, description })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, description, updatedAt: new Date() },
      })
      .returning();

    return saved;
  }

  async cleanSlate(userId?: string, userName?: string, userRole?: string, ipAddress?: string) {
    return await db.transaction(async (tx) => {
      // Execute deletion strictly in child-to-parent order to respect PostgreSQL Foreign Key dependencies
      await tx.execute(sql`DELETE FROM tracking_events;`);
      await tx.execute(sql`DELETE FROM manifests;`);
      await tx.execute(sql`DELETE FROM bills_of_lading;`);
      await tx.execute(sql`DELETE FROM shipments;`);
      await tx.execute(sql`DELETE FROM consolidations;`);
      await tx.execute(sql`DELETE FROM house_bills;`);
      await tx.execute(sql`DELETE FROM cargo;`);
      await tx.execute(sql`DELETE FROM warehouse_receipts;`);
      await tx.execute(sql`DELETE FROM customers;`);

      // Count existing audit logs to generate unique log number
      const [{ auditCount }] = await tx.select({ auditCount: count() }).from(auditLogs);
      const logSeq = String(Number(auditCount) + 1).padStart(4, '0');
      const logNumber = `AUD-${logSeq}`;
      const nowStr = new Date().toISOString();

      const validUserId = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
        ? userId
        : null;

      // PRESERVE audit_logs: Never delete audit logs, instead record the clean slate event
      await tx.insert(auditLogs).values({
        logNumber,
        timestamp: nowStr,
        userId: validUserId,
        userName: userName || 'Super Admin',
        userRole: userRole || 'super_admin',
        module: 'System',
        action: 'CLEAN_SLATE_RESET',
        recordId: 'TRANSACTIONS_ALL',
        description: `Clean Slate Transactional Reset executed by ${userName || 'Super Admin'}`,
        ipAddress: ipAddress || '127.0.0.1',
        metadata: {
          timestamp: nowStr,
          preservedTables: ['audit_logs', 'users', 'roles', 'permissions', 'ports', 'agents', 'vessels', 'voyages', 'containers', 'settings'],
          clearedTables: ['tracking_events', 'manifests', 'bills_of_lading', 'shipments', 'consolidations', 'house_bills', 'cargo', 'warehouse_receipts', 'customers']
        },
      });

      return true;
    });
  }
}

export const settingsRepository = new SettingsRepository();
