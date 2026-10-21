import { FastifyInstance } from 'fastify';
import { db, pool, testDbConnection } from '../db/index.js';

export async function registerDbPlugin(app: FastifyInstance): Promise<void> {
  app.decorate('db', db);

  const isConnected = await testDbConnection();
  if (isConnected) {
    app.log.info('PostgreSQL database connected successfully (Database: Warhouse)');
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          log_number TEXT NOT NULL UNIQUE,
          timestamp TEXT NOT NULL,
          user_id UUID,
          user_name TEXT NOT NULL,
          user_role TEXT,
          module TEXT NOT NULL,
          action TEXT NOT NULL,
          record_id TEXT,
          description TEXT NOT NULL,
          ip_address TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS shipments (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          shipment_number TEXT NOT NULL UNIQUE,
          type TEXT DEFAULT 'Ocean LCL Consolidation' NOT NULL,
          service_mode TEXT DEFAULT 'Port-to-Port' NOT NULL,
          status TEXT DEFAULT 'Cargo Received' NOT NULL,
          tracking_number TEXT NOT NULL UNIQUE,
          origin TEXT NOT NULL,
          destination TEXT NOT NULL,
          destination_port TEXT NOT NULL,
          destination_code TEXT NOT NULL,
          agent_id UUID,
          agent_name TEXT,
          vessel_name TEXT,
          carrier TEXT,
          container_number TEXT,
          container_type TEXT,
          seal_number TEXT,
          bill_of_lading_id TEXT,
          bill_of_lading_number TEXT,
          bl_status TEXT,
          manifest_number TEXT,
          total_packages INTEGER DEFAULT 0 NOT NULL,
          total_weight_lbs NUMERIC(10,2) DEFAULT '0.00',
          total_weight_kg NUMERIC(10,2) DEFAULT '0.00',
          total_cft NUMERIC(10,2) DEFAULT '0.00',
          total_cbm NUMERIC(10,2) DEFAULT '0.00',
          etd TEXT,
          eta TEXT,
          created_date TEXT NOT NULL,
          warehouse_receipt_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
          consolidation_id TEXT,
          current_location TEXT,
          tracking_checkpoints JSONB DEFAULT '[]'::jsonb NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ports (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          port_code TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          island TEXT,
          country TEXT NOT NULL,
          status TEXT DEFAULT 'Active' NOT NULL,
          default_agent TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          key TEXT NOT NULL UNIQUE,
          value JSONB NOT NULL,
          description TEXT,
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
      `);
    } catch (err: any) {
      app.log.warn(`Database tables verification notice: ${err?.message}`);
    }
  } else {
    app.log.error('PostgreSQL database connection failed!');
  }

  app.addHook('onClose', async () => {
    app.log.info('Closing PostgreSQL connection pool...');
    await pool.end();
  });
}
