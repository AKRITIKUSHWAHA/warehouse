import { z } from 'zod';

export const vesselQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const createVesselSchema = z.object({
  name: z.string().min(2, 'Vessel name is required'),
  type: z.string().optional().default('Merchant Vessel'), // Vessel classification / type (client confirmation pending)
  notes: z.string().optional(),
  imoNumber: z.string().optional(),
  flag: z.string().optional(),
  carrier: z.string().optional(),
  capacityTeu: z.coerce.number().optional(),
  deadweightTonnage: z.coerce.number().optional(),
  builtYear: z.coerce.number().optional(),
  status: z.string().optional().default('Active'),
  currentVoyage: z.string().optional(),
  activeRoute: z.string().optional(),
  etaNextPort: z.string().optional(),
  lengthFeet: z.coerce.number().optional(),
});

export const updateVesselSchema = createVesselSchema.partial();

