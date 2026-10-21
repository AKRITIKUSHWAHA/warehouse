import { pgTable, uuid, text, integer, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { consolidations } from './consolidations.schema.js';
import { agents } from './agents.schema.js';
import { customers } from './customers.schema.js';

export interface HoldDetails {
  isOnHold: boolean;
  reason?: string | null;
  placedBy?: string | null;
  placedAt?: string | null;
  holdCategory?: string | null;
  holdNotes?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  releasedBy?: string | null;
  releasedAt?: string | null;
}

export interface FreightCharge {
  description: string;
  rate: string;
  amount: number;
  prepaid: boolean;
}

export const billsOfLading = pgTable('bills_of_lading', {
  id: uuid('id').defaultRandom().primaryKey(),
  blNumber: text('bl_number').notNull().unique(), // e.g. "BL-VI-2026-0092"
  type: text('type').default('Master Ocean Bill of Lading').notNull(),
  status: text('status').default('Draft').notNull(), // 'Draft' | 'On Hold' | 'Released' | 'Cancelled'
  
  shipmentId: text('shipment_id'),
  shipmentNumber: text('shipment_number'),
  consolidationId: uuid('consolidation_id').references(() => consolidations.id),
  houseBillIds: jsonb('house_bill_ids').$type<string[]>().default([]).notNull(),
  
  createdDate: text('created_date').notNull(),
  issueDate: text('issue_date'),
  
  shipperId: uuid('shipper_id').references(() => customers.id),
  shipper: jsonb('shipper').notNull(),
  consigneeId: uuid('consignee_id').references(() => customers.id),
  consignee: jsonb('consignee').notNull(),
  notifyParty: jsonb('notify_party'),
  
  agentId: uuid('agent_id').references(() => agents.id),
  agentName: text('agent_name'),
  
  preCarriageBy: text('pre_carriage_by'),
  placeOfReceipt: text('place_of_receipt'),
  oceanVessel: text('ocean_vessel'),
  carrier: text('carrier'),
  portOfLoading: text('port_of_loading').notNull(),
  portOfDischarge: text('port_of_discharge').notNull(),
  placeOfDelivery: text('place_of_delivery'),
  
  containerNumber: text('container_number'),
  sealNumber: text('seal_number'),
  containerType: text('container_type'),
  marksAndNumbers: text('marks_and_numbers'),
  cargoDescription: text('cargo_description'),
  
  packageCount: integer('package_count').default(0).notNull(),
  totalPieces: integer('total_pieces').default(0).notNull(),
  packageType: text('package_type'),
  grossWeightLbs: numeric('gross_weight_lbs', { precision: 10, scale: 2 }).default('0.00'),
  grossWeightKg: numeric('gross_weight_kg', { precision: 10, scale: 2 }).default('0.00'),
  cbm: numeric('cbm', { precision: 10, scale: 2 }).default('0.00'),
  cft: numeric('cft', { precision: 10, scale: 2 }).default('0.00'),
  
  freightPayableAt: text('freight_payable_at').default('Miami, FL'),
  freightTerms: text('freight_terms').default('Freight Prepaid').notNull(),
  numberOfOriginals: text('number_of_originals').default('3 (THREE)').notNull(),
  
  // Hold Governance: Critical business requirement
  holdDetails: jsonb('hold_details').$type<HoldDetails>().default({ isOnHold: false }).notNull(),
  
  charges: jsonb('charges').$type<FreightCharge[]>().default([]).notNull(),
  totalFreightUsd: numeric('total_freight_usd', { precision: 10, scale: 2 }).default('0.00'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type BillOfLading = typeof billsOfLading.$inferSelect;
export type NewBillOfLading = typeof billsOfLading.$inferInsert;
