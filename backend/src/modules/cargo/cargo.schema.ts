import { z } from 'zod';

export const cargoQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  destinationCode: z.string().optional(),
  warehouseReceiptId: z.string().optional(),
  agentId: z.string().optional(),
});

export const createCargoSchema = z.object({
  cargoNumber: z.string().optional(),
  id: z.string().optional(),
  warehouseReceiptId: z.string().nullish().transform(v => (v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) ? v : undefined),
  receiptNumber: z.string().nullish().default(''),
  customer: z.string().min(1, 'Customer name is required'),
  description: z.string().min(1, 'Description is required'),
  packageCount: z.coerce.number().optional().default(1),
  totalPieces: z.coerce.number().optional().default(1),
  packageType: z.string().optional().default('Cartons'),
  lengthInches: z.coerce.number().nullish(),
  widthInches: z.coerce.number().nullish(),
  heightInches: z.coerce.number().nullish(),
  weightLbs: z.coerce.number().nullish(),
  weightKg: z.coerce.number().nullish(),
  cft: z.coerce.number().nullish(),
  cbm: z.coerce.number().nullish(),
  warehouseLocation: z.string().optional().default('Bay A-01'),
  destinationPort: z.string().optional().default('NAS - Nassau, Bahamas'),
  destinationCode: z.string().optional().default('NAS'),
  agentId: z.string().nullish().transform(v => (v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) ? v : undefined),
  agentName: z.string().nullish(),
  status: z.string().optional().default('Ready for Consolidation'),
  barcode: z.string().optional(),
  qrCode: z.string().optional(),
});

export const updateCargoSchema = createCargoSchema.partial();
