import { pgTable, uuid, text, integer, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { customers } from './customers.schema.js';
import { agents } from './agents.schema.js';

export interface ShipperInfo {
  name: string;
  address: string;
  contact?: string;
  taxId?: string;
}

export interface ConsigneeInfo {
  name: string;
  address: string;
  taxId?: string;
  contact?: string;
}

export interface NotifyPartyInfo {
  name: string;
  address: string;
  contact?: string;
}

export const houseBills = pgTable('house_bills', {
  id: uuid('id').defaultRandom().primaryKey(),
  hblNumber: text('hbl_number').notNull().unique(), // e.g. "HBL-2026-0001"
  
  customerId: uuid('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  shipperId: uuid('shipper_id').references(() => customers.id),
  shipper: jsonb('shipper').$type<ShipperInfo>().notNull(),
  consigneeId: uuid('consignee_id').references(() => customers.id),
  consignee: jsonb('consignee').$type<ConsigneeInfo>().notNull(),
  notifyParty: jsonb('notify_party').$type<NotifyPartyInfo>(),
  
  agentId: uuid('agent_id').references(() => agents.id),
  agentName: text('agent_name'),
  
  originPort: text('origin_port').default('Port of Miami (USMIA), FL').notNull(),
  destinationPort: text('destination_port').notNull(),
  destinationCode: text('destination_code').notNull(),
  
  warehouseReceiptIds: jsonb('warehouse_receipt_ids').$type<string[]>().default([]).notNull(),
  cargoDescription: text('cargo_description'),
  packages: jsonb('packages').$type<unknown[]>().default([]).notNull(),
  
  totalPackages: integer('total_packages').default(0).notNull(),
  totalPieces: integer('total_pieces').default(0).notNull(),
  totalWeightLbs: numeric('total_weight_lbs', { precision: 10, scale: 2 }).default('0.00'),
  totalWeightKg: numeric('total_weight_kg', { precision: 10, scale: 2 }).default('0.00'),
  totalCft: numeric('total_cft', { precision: 10, scale: 2 }).default('0.00'),
  totalCbm: numeric('total_cbm', { precision: 10, scale: 2 }).default('0.00'),
  
  status: text('status').default('Active').notNull(), // 'Active' | 'Consolidated' | 'Cancelled'
  freightTerms: text('freight_terms').default('Freight Prepaid').notNull(),
  createdDate: text('created_date').notNull(),
  issueDate: text('issue_date'),
  
  assignedConsolidationId: text('assigned_consolidation_id'),
  assignedMasterBLId: text('assigned_master_bl_id'),
  assignedShipmentId: text('assigned_shipment_id'),
  notes: text('notes'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type HouseBill = typeof houseBills.$inferSelect;
export type NewHouseBill = typeof houseBills.$inferInsert;
