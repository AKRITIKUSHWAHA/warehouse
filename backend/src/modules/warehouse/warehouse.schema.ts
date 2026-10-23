import { z } from 'zod';

export const packageItemSchema = z.object({
  id: z.string().optional(),
  packageType: z.string().default('Carton'),
  description: z.string().default('General Cargo'),
  lengthInches: z.coerce.number().min(0).default(0),
  widthInches: z.coerce.number().min(0).default(0),
  heightInches: z.coerce.number().min(0).default(0),
  weightLbs: z.coerce.number().min(0).default(0),
  pieces: z.coerce.number().min(1).default(1),
  cft: z.coerce.number().optional().default(0),
  cbm: z.coerce.number().optional().default(0),
});

export const createWarehouseReceiptSchema = z.object({
  receiptNumber: z.string().optional(),
  sequenceNumber: z.coerce.number().optional(),
  date: z.string().optional(),
  customerId: z.string().nullish(),
  customerName: z.string().nullish(),
  customer: z.string().nullish(),
  shipperId: z.string().nullish(),
  shipper: z.string().nullish(),
  consigneeId: z.string().nullish(),
  consignee: z.string().nullish(),
  agentId: z.string().nullish(),
  agentName: z.string().nullish(),
  destinationPort: z.string().nullish(),
  destinationCode: z.string().nullish(),
  cargoDescription: z.string().nullish(),
  packages: z.array(packageItemSchema).optional().default([]),
  packageCount: z.coerce.number().optional().default(1),
  totalPieces: z.coerce.number().optional().default(1),
  packageType: z.string().optional().default('Carton'),
  lengthInches: z.coerce.number().nullish(),
  widthInches: z.coerce.number().nullish(),
  heightInches: z.coerce.number().nullish(),
  weightLbs: z.coerce.number().nullish(),
  weightKg: z.coerce.number().nullish(),
  cft: z.coerce.number().nullish(),
  cbm: z.coerce.number().nullish(),
  totalCft: z.coerce.number().nullish(),
  totalCbm: z.coerce.number().nullish(),
  warehouseLocation: z.string().optional().default('Bay A-1 (CFS Staging)'),
  status: z.string().optional().default('Received'),
  hazardous: z.boolean().optional().default(false),
  fragile: z.boolean().optional().default(false),
  notes: z.string().nullish().default(''),
});

export const updateWarehouseReceiptSchema = createWarehouseReceiptSchema.partial().extend({
  assignedHouseBillId: z.string().nullish(),
  assignedConsolidationId: z.string().nullish(),
  assignedShipmentId: z.string().nullish(),
});

export const warehouseReceiptQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  destinationCode: z.string().optional(),
  customerId: z.string().optional(),
  agentId: z.string().optional(),
});
