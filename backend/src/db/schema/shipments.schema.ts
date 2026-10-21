import { pgTable, uuid, text, integer, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { agents } from './agents.schema.js';

export interface TrackingCheckpoint {
  id: string;
  stage: string;
  status: 'Pending' | 'Active' | 'Completed';
  date: string;
  time?: string;
  location: string;
  notes?: string;
}

export const shipments = pgTable('shipments', {
  id: uuid('id').defaultRandom().primaryKey(),
  shipmentNumber: text('shipment_number').notNull().unique(), // e.g. "SHP-2026-0291"
  type: text('type').default('Ocean LCL Consolidation').notNull(),
  serviceMode: text('service_mode').default('Port-to-Port').notNull(),
  status: text('status').default('Cargo Received').notNull(), // 'Cargo Received' | 'Consolidated' | 'Loaded & Sealed' | 'In Transit' | 'Arrived at Port' | 'Delivered / Released'
  trackingNumber: text('tracking_number').notNull().unique(),
  
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  destinationPort: text('destination_port').notNull(),
  destinationCode: text('destination_code').notNull(),
  
  agentId: uuid('agent_id').references(() => agents.id),
  agentName: text('agent_name'),
  
  vesselName: text('vessel_name'),
  carrier: text('carrier'),
  
  containerNumber: text('container_number'),
  containerType: text('container_type'),
  sealNumber: text('seal_number'),
  
  billOfLadingId: text('bill_of_lading_id'),
  billOfLadingNumber: text('bill_of_lading_number'),
  blStatus: text('bl_status'),
  manifestNumber: text('manifest_number'),
  
  totalPackages: integer('total_packages').default(0).notNull(),
  totalWeightLbs: numeric('total_weight_lbs', { precision: 10, scale: 2 }).default('0.00'),
  totalWeightKg: numeric('total_weight_kg', { precision: 10, scale: 2 }).default('0.00'),
  totalCft: numeric('total_cft', { precision: 10, scale: 2 }).default('0.00'),
  totalCbm: numeric('total_cbm', { precision: 10, scale: 2 }).default('0.00'),
  
  etd: text('etd'),
  eta: text('eta'),
  createdDate: text('created_date').notNull(),
  
  warehouseReceiptIds: jsonb('warehouse_receipt_ids').$type<string[]>().default([]).notNull(),
  consolidationId: text('consolidation_id'),
  currentLocation: text('current_location'),
  
  trackingCheckpoints: jsonb('tracking_checkpoints').$type<TrackingCheckpoint[]>().default([]).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Shipment = typeof shipments.$inferSelect;
export type NewShipment = typeof shipments.$inferInsert;
