import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerNumber: text('customer_number').notNull().unique(), // e.g., 'CUS-2026-0001'
  name: text('name').notNull(),
  companyName: text('company_name').notNull(),
  contactPerson: text('contact_person'),
  email: text('email'),
  telephone: text('telephone'),
  phone: text('phone'),
  address: text('address'),
  destinationPort: text('destination_port'), // 'NAS - Nassau, Bahamas'
  destinationCode: text('destination_code'), // 'NAS'
  taxId: text('tax_id'),
  accountType: text('account_type').default('Commercial Customer'), // 'Commercial Customer' | 'Wholesaler' | 'Retail' | 'Corporate'
  creditTerms: text('credit_terms'), // 'Net 30' | 'Net 15' | 'Prepaid'
  notes: text('notes'),
  status: text('status').default('Active').notNull(),
  createdDate: text('created_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
