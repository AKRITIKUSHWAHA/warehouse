import { pgTable, uuid, text, integer, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { containers } from './containers.schema.js';
import { vessels } from './vessels.schema.js';
import { voyages } from './voyages.schema.js';

export const consolidations = pgTable('consolidations', {
  id: uuid('id').defaultRandom().primaryKey(),
  consolidationNumber: text('consolidation_number').notNull().unique(), // e.g. "CNS-2026-0819"
  title: text('title').notNull(),
  destinationPort: text('destination_port').notNull(),
  destinationCode: text('destination_code').notNull(),
  createdDate: text('created_date').notNull(),
  status: text('status').default('Planning').notNull(), // 'Planning' | 'Loaded' | 'Sealed' | 'Completed'
  
  containerId: uuid('container_id').references(() => containers.id),
  containerNumber: text('container_number'),
  containerType: text('container_type'),
  containerCapacityCbm: numeric('container_capacity_cbm', { precision: 10, scale: 2 }),
  sealNumber: text('seal_number'),
  
  vesselId: uuid('vessel_id').references(() => vessels.id),
  vesselName: text('vessel_name'),
  voyageId: uuid('voyage_id').references(() => voyages.id),
  voyageNumber: text('voyage_number'),
  carrier: text('carrier'),
  
  loadingPort: text('loading_port').default('Port of Miami (USMIA)').notNull(),
  dischargePort: text('discharge_port').notNull(),
  
  totalHouseBills: integer('total_house_bills').default(0).notNull(),
  houseBillIds: jsonb('house_bill_ids').$type<string[]>().default([]).notNull(),
  
  totalReceipts: integer('total_receipts').default(0).notNull(),
  receiptIds: jsonb('receipt_ids').$type<string[]>().default([]).notNull(),
  
  totalPackages: integer('total_packages').default(0).notNull(),
  totalPieces: integer('total_pieces').default(0).notNull(),
  totalWeightLbs: numeric('total_weight_lbs', { precision: 10, scale: 2 }).default('0.00'),
  totalWeightKg: numeric('total_weight_kg', { precision: 10, scale: 2 }).default('0.00'),
  totalCft: numeric('total_cft', { precision: 10, scale: 2 }).default('0.00'),
  totalCbm: numeric('total_cbm', { precision: 10, scale: 2 }).default('0.00'),
  containerFillPercentage: numeric('container_fill_percentage', { precision: 5, scale: 2 }).default('0.00'),
  
  assignedShipmentId: text('assigned_shipment_id'),
  assignedMasterBLId: text('assigned_master_bl_id'),
  agentId: text('agent_id'),
  agentName: text('agent_name'),
  notes: text('notes'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Consolidation = typeof consolidations.$inferSelect;
export type NewConsolidation = typeof consolidations.$inferInsert;
