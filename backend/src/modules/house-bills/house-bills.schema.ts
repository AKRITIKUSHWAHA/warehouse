import { z } from 'zod';

export const contactObjectSchema = z.preprocess((val: any) => {
  if (typeof val === 'string') {
    return { name: val.trim() || 'General Party', address: 'Miami, FL' };
  }
  if (val && typeof val === 'object') {
    const rawName = val.name || val.companyName || val.customerName || val.contactPerson || val.contact;
    const cleanName = (typeof rawName === 'string' && rawName.trim().length > 0) ? rawName.trim() : 'General Consignee';
    const cleanAddress = (typeof val.address === 'string' && val.address.trim().length > 0) ? val.address.trim() : 'Destination Port';
    return {
      name: cleanName,
      address: cleanAddress,
      contact: val.contact || undefined,
      taxId: val.taxId || undefined,
    };
  }
  return { name: 'General Consignee', address: 'Destination Port' };
}, z.object({
  name: z.string().min(1),
  address: z.string().optional().default('Miami, FL'),
  contact: z.string().optional(),
  taxId: z.string().optional(),
}));

export const createHouseBillSchema = z.object({
  hblNumber: z.string().optional(),
  customerId: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val && val.includes('-') && val.length === 36 ? val : undefined)),
  customerName: z.preprocess((val: any) => {
    if (typeof val === 'string' && val.trim().length > 0) return val.trim();
    return 'General Customer';
  }, z.string().min(1)),
  shipper: contactObjectSchema,
  consignee: contactObjectSchema,
  notifyParty: contactObjectSchema.optional(),
  agentId: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val && val.includes('-') && val.length === 36 ? val : undefined)),
  agentName: z.string().optional(),
  originPort: z.string().optional().default('Port of Miami (USMIA), FL'),
  destinationPort: z.string().min(2),
  destinationCode: z.string().min(2),
  warehouseReceiptIds: z.array(z.string()).optional().default([]),
  cargoDescription: z.string().optional(),
  packages: z.array(z.unknown()).optional().default([]),
  totalPackages: z.coerce.number().optional().default(0),
  totalPieces: z.coerce.number().optional().default(0),
  totalWeightLbs: z.coerce.number().optional().default(0),
  totalWeightKg: z.coerce.number().optional().default(0),
  totalCft: z.coerce.number().optional().default(0),
  totalCbm: z.coerce.number().optional().default(0),
  freightTerms: z.string().optional().default('Freight Prepaid'),
  status: z.string().optional().default('Active'),
  issueDate: z.string().optional(),
  createdDate: z.string().optional(),
  assignedConsolidationId: z.string().optional(),
  assignedMasterBLId: z.string().optional(),
  assignedShipmentId: z.string().optional(),
  freightCharges: z.any().optional(),
  notes: z.string().optional(),
});

export const updateHouseBillSchema = createHouseBillSchema.partial().extend({
  status: z.string().optional(),
  assignedConsolidationId: z.string().optional(),
  assignedMasterBLId: z.string().optional(),
  assignedShipmentId: z.string().optional(),
});

export const houseBillHoldSchema = z.object({
  reason: z.string().min(2, 'Hold reason is required'),
  holdNotes: z.string().optional(),
  holdCategory: z.string().optional().default('Documentation Hold'),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
});


export const houseBillQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(100),
  search: z.string().optional(),
  status: z.string().optional(),
  destinationCode: z.string().optional(),
  customerId: z.string().optional(),
});
