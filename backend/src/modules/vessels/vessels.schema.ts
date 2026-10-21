import { z } from 'zod';

export const vesselQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(50),
  search: z.string().optional(),
});

export const createVesselSchema = z.object({
  name: z.string().min(1, 'Vessel name is required'),
  type: z.string().optional().default('Container Vessel'), // Vessel classification / type
  notes: z.string().optional(),
  carrier: z.string().optional(),
});

export const updateVesselSchema = createVesselSchema.partial();

