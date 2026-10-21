import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const vessels = pgTable('vessels', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: text('type'), // Vessel classification / type (client confirmation pending)
  notes: text('notes'), // Optional fleet directory notes
  imoNumber: text('imo_number'),
  flag: text('flag'),
  carrier: text('carrier'),
  capacityTeu: integer('capacity_teu'),
  deadweightTonnage: integer('deadweight_tonnage'),
  builtYear: integer('built_year'),
  status: text('status').default('Active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Vessel = typeof vessels.$inferSelect;
export type NewVessel = typeof vessels.$inferInsert;
