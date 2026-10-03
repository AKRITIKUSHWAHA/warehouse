import { z } from 'zod';

export const voyageQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const createVoyageSchema = z.object({
<<<<<<< HEAD
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
  totalTeuUtilized: z.coerce.number().nullish().default(0),
});

export const updateVoyageSchema = createVoyageSchema.partial();
=======
  voyageNumber: z.string().min(1, 'Voyage number is required'),
  vesselId: z.string().uuid().optional().nullable(),
  vesselName: z.string().min(1, 'Vessel name is required'),
  carrier: z.string().optional().nullable(),
  originPort: z.string().min(1, 'Origin port is required'),
  destinationPort: z.string().min(1, 'Destination port is required'),
  departureDate: z.string().optional().nullable(),
  arrivalDate: z.string().optional().nullable(),
  status: z.string().default('Scheduled'),
  assignedShipmentsCount: z.coerce.number().optional().default(0),
  totalTeuUtilized: z.union([z.string(), z.number()]).optional().default('0.00'),
});

export const updateVoyageSchema = createVoyageSchema.partial();

>>>>>>> cd5336dd0aa4dc9bc5f6babb410f9351c3606c8b
