import { pgTable, uuid, text, integer, numeric, timestamp } from 'drizzle-orm/pg-core';
import { warehouseReceipts } from './warehouse-receipts.schema.js';

export const cargo = pgTable('cargo', {
  id: uuid('id').defaultRandom().primaryKey(),
  cargoNumber: text('cargo_number').notNull().unique(), // e.g. "CRG-1041-01"
  warehouseReceiptId: uuid('warehouse_receipt_id')
    .references(() => warehouseReceipts.id, { onDelete: 'cascade' }),
  receiptNumber: text('receipt_number'),
  customer: text('customer').notNull(),
  description: text('description').notNull(),
  packageCount: integer('package_count').default(1).notNull(),
  totalPieces: integer('total_pieces').default(1).notNull(),
  packageType: text('package_type'),
  lengthInches: numeric('length_inches', { precision: 10, scale: 2 }),
  widthInches: numeric('width_inches', { precision: 10, scale: 2 }),
  heightInches: numeric('height_inches', { precision: 10, scale: 2 }),
  weightLbs: numeric('weight_lbs', { precision: 10, scale: 2 }),
  weightKg: numeric('weight_kg', { precision: 10, scale: 2 }),
  cft: numeric('cft', { precision: 10, scale: 2 }),
  cbm: numeric('cbm', { precision: 10, scale: 2 }),
  warehouseLocation: text('warehouse_location').default('CFS Miami'),
  destinationPort: text('destination_port'),
  destinationCode: text('destination_code'),
  agentId: uuid('agent_id'),
  agentName: text('agent_name'),
  status: text('status').default('Ready for Consolidation').notNull(),
  barcode: text('barcode'),
  qrCode: text('qr_code'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Cargo = typeof cargo.$inferSelect;
export type NewCargo = typeof cargo.$inferInsert;
