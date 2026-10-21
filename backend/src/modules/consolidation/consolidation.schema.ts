import { z } from 'zod';

export const createConsolidationSchema = z.object({
  id: z.string().optional(),
  consolidationNumber: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  destinationPort: z.string().optional().default(''),
  destinationCode: z.string().optional().default(''),
  createdDate: z.string().optional(),
  status: z.string().optional().default('Planning'),
  containerNumber: z.string().nullish().default(''),
  containerType: z.string().nullish().default('40ft High Cube Standard'),
  sealNumber: z.string().nullish().default(''),
  vesselId: z.string().nullish().transform(v => (v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) ? v : undefined),
  vesselName: z.string().nullish().default(''),
  carrier: z.string().nullish().default(''),
  loadingPort: z.string().optional().default('Port of Miami (USMIA)'),
  dischargePort: z.string().optional().default(''),
  totalHouseBills: z.coerce.number().optional().default(0),
  houseBillIds: z.array(z.string()).optional().default([]),
  totalReceipts: z.coerce.number().optional().default(0),
  receiptIds: z.array(z.string()).optional().default([]),
  totalPackages: z.coerce.number().optional().default(0),
  totalPieces: z.coerce.number().optional().default(0),
  totalWeightLbs: z.coerce.number().nullish().default(0),
  totalWeightKg: z.coerce.number().nullish().default(0),
  totalCft: z.coerce.number().nullish().default(0),
  totalCbm: z.coerce.number().nullish().default(0),
  assignedShipmentId: z.string().nullish(),
  assignedMasterBLId: z.string().nullish(),
  agentId: z.string().nullish(),
  agentName: z.string().nullish(),
  etd: z.string().nullish(),
  eta: z.string().nullish(),
  notes: z.string().nullish().default(''),
});

export const updateConsolidationSchema = createConsolidationSchema.partial();

export const consolidationQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(100),
  search: z.string().optional(),
  status: z.string().optional(),
  destinationCode: z.string().optional(),
});
