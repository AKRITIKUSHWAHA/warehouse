import { z } from 'zod';

export const voyageQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const createVoyageSchema = z.object({
  id: z.string().optional(),
  voyageNumber: z.string().min(1, 'Voyage number is required'),
  vesselId: z.string().nullish().transform(v => (v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) ? v : undefined),
  vesselName: z.string().min(1, 'Vessel name is required'),
  carrier: z.string().nullish().default(''),
  originPort: z.string().min(1, 'Origin port is required'),
  destinationPort: z.string().min(1, 'Destination port is required'),
  departureDate: z.string().nullish(),
  arrivalDate: z.string().nullish(),
  status: z.string().optional().default('Scheduled'),
  assignedShipmentsCount: z.coerce.number().optional().default(0),
  totalTeuUtilized: z.union([z.string(), z.number()]).nullish().default(0),
});

export const updateVoyageSchema = createVoyageSchema.partial();
