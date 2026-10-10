import { z } from 'zod';

export const historyQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  destinationCode: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
