import { z } from 'zod';

export const shipmentQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(200),
  search: z.string().optional(),
  status: z.string().optional(),
  destinationCode: z.string().optional(),
  destination: z.string().optional(),
  agentId: z.string().optional(),
});

export const createShipmentSchema = z.object({
  shipmentNumber: z.string().optional(),
  type: z.string().optional().default('Ocean LCL Consolidation'),
  serviceMode: z.string().optional().default('Port-to-Port'),
  status: z.string().optional().default('Cargo Received'),
  trackingNumber: z.string().optional(),

  origin: z.string().default('Port of Miami (USMIA)'),
  destination: z.string().optional(),
  destinationPort: z.string().default(''),
  destinationCode: z.string().default(''),

  agentId: z.string().nullish(),
  agentName: z.string().optional(),

  vesselName: z.string().optional(),
  carrier: z.string().optional(),

  containerNumber: z.string().optional(),
  containerType: z.string().optional(),
  sealNumber: z.string().optional(),

  billOfLadingId: z.string().optional(),
  billOfLadingNumber: z.string().optional(),
  blStatus: z.string().optional(),
  manifestNumber: z.string().optional(),

  totalPackages: z.coerce.number().optional().default(0),
  totalWeightLbs: z.coerce.number().optional().default(0),
  totalWeightKg: z.coerce.number().optional().default(0),
  totalCft: z.coerce.number().optional().default(0),
  totalCbm: z.coerce.number().optional().default(0),

  etd: z.string().optional(),
  eta: z.string().optional(),
  createdDate: z.string().optional(),

  warehouseReceiptIds: z.array(z.string()).optional().default([]),
  consolidationId: z.string().optional(),
  currentLocation: z.string().optional(),
  trackingCheckpoints: z.array(z.any()).optional().default([]),
});

export const updateShipmentSchema = createShipmentSchema.partial();
