import { pgTable, uuid, text, integer, numeric, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { customers } from './customers.schema.js';
import { agents } from './agents.schema.js';

export interface PackageItem {
  id?: string;
  packageType: string;
  description: string;
  lengthInches: number;
  widthInches: number;
  heightInches: number;
  weightLbs: number;
  pieces: number;
  cft: number;
  cbm: number;
}

export const warehouseReceipts = pgTable('warehouse_receipts', {
  // UUID internal database primary key
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Business identifier: numeric starting from 3100
  receiptNumber: text('receipt_number').notNull().unique(), // e.g. "3100", "3101"
  sequenceNumber: integer('sequence_number').notNull().unique(), // numeric integer 3100, 3101...
  
  date: text('date').notNull(),
  time: text('time'),
  
  customerId: uuid('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  shipperId: uuid('shipper_id').references(() => customers.id),
  shipper: text('shipper'),
  consigneeId: uuid('consignee_id').references(() => customers.id),
  consignee: text('consignee'),
  
  agentId: uuid('agent_id').references(() => agents.id),
  agentName: text('agent_name'),
  
  destinationPort: text('destination_port').notNull(), // 'NAS - Nassau, Bahamas'
  destinationCode: text('destination_code').notNull(), // 'NAS'
  cargoDescription: text('cargo_description'),
  
  packageCount: integer('package_count').default(1).notNull(),
  totalPieces: integer('total_pieces').default(1).notNull(),
  packageType: text('package_type'),
  
  // Package-level records
  packages: jsonb('packages').$type<PackageItem[]>().default([]).notNull(),
  
  // Dimensions and weight (summary)
  lengthInches: numeric('length_inches', { precision: 10, scale: 2 }),
  widthInches: numeric('width_inches', { precision: 10, scale: 2 }),
  heightInches: numeric('height_inches', { precision: 10, scale: 2 }),
  weightLbs: numeric('weight_lbs', { precision: 10, scale: 2 }),
  weightKg: numeric('weight_kg', { precision: 10, scale: 2 }),
  totalCft: numeric('total_cft', { precision: 10, scale: 2 }),
  totalCbm: numeric('total_cbm', { precision: 10, scale: 2 }),
  
  warehouseLocation: text('warehouse_location').default('CFS Miami'),
  status: text('status').default('Received').notNull(),
  hazardous: boolean('hazardous').default(false).notNull(),
  fragile: boolean('fragile').default(false).notNull(),
  notes: text('notes'),
  
  barcode: text('barcode'),
  qrCode: text('qr_code'),
  
  // Linkages to downstream workflow
  assignedHouseBillId: text('assigned_house_bill_id'),
  assignedConsolidationId: text('assigned_consolidation_id'),
  assignedShipmentId: text('assigned_shipment_id'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type WarehouseReceipt = typeof warehouseReceipts.$inferSelect;
export type NewWarehouseReceipt = typeof warehouseReceipts.$inferInsert;
