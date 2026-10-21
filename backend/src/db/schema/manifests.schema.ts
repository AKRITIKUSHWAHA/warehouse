import { pgTable, uuid, text, integer, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';

export interface ManifestLineItem {
  itemNumber: number;
  hblNumber: string;
  blNumber: string;
  shipper: string;
  consignee: string;
  notifyParty?: string;
  destinationPort: string;
  containerNumber: string;
  sealNumber: string;
  packageCount: number;
  totalPieces: number;
  packageType: string;
  cargoDescription: string;
  grossWeightKg: number;
  grossWeightLbs: number;
  cbm: number;
  cft: number;
  customsValueUsd?: number;
}

export const manifests = pgTable('manifests', {
  id: uuid('id').defaultRandom().primaryKey(),
  manifestNumber: text('manifest_number').notNull().unique(), // e.g. "MNF-2026-0441"
  type: text('type').default('Ocean Cargo Inward / Outward Manifest').notNull(),
  title: text('title').notNull(),
  vesselName: text('vessel_name').notNull(),
  flag: text('flag'),
  masterName: text('master_name'),
  portOfLoading: text('port_of_loading').notNull(),
  portOfDischarge: text('port_of_discharge').notNull(),
  departureDate: text('departure_date'),
  arrivalDate: text('arrival_date'),
  carrier: text('carrier'),
  
  totalBLs: integer('total_bls').default(1).notNull(),
  totalHouseBills: integer('total_house_bills').default(0).notNull(),
  totalContainers: integer('total_containers').default(1).notNull(),
  totalPackages: integer('total_packages').default(0).notNull(),
  totalPieces: integer('total_pieces').default(0).notNull(),
  totalWeightLbs: numeric('total_weight_lbs', { precision: 10, scale: 2 }).default('0.00'),
  totalWeightKg: numeric('total_weight_kg', { precision: 10, scale: 2 }).default('0.00'),
  totalCbm: numeric('total_cbm', { precision: 10, scale: 2 }).default('0.00'),
  totalCft: numeric('total_cft', { precision: 10, scale: 2 }).default('0.00'),
  
  status: text('status').default('Generated').notNull(), // 'Draft' | 'Generated' | 'Generated (Subject to B/L Hold)' | 'Closed'
  masterBLNumber: text('master_bl_number'),
  lineItems: jsonb('line_items').$type<ManifestLineItem[]>().default([]).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Manifest = typeof manifests.$inferSelect;
export type NewManifest = typeof manifests.$inferInsert;
