import { z } from 'zod';

export const billOfLadingQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  agentId: z.string().optional(),
});

export const holdActionSchema = z.object({
  reason: z.string().min(5, 'Hold reason is required'),
  holdCategory: z.string().optional().default('Financial Clearance'),
  holdNotes: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
});

export const createBillOfLadingSchema = z.object({
  blNumber: z.string().optional(),
  type: z.string().optional().default('Master Ocean Bill of Lading'),
  status: z.string().optional().default('Draft'),

  shipmentId: z.string().optional(),
  shipmentNumber: z.string().optional(),
  consolidationId: z.string().nullish(),
  consolidationNumber: z.string().nullish(),
  houseBillIds: z.array(z.string()).optional().default([]),

  createdDate: z.string().optional(),
  issueDate: z.string().optional(),

  shipperId: z.string().nullish(),
  shipper: z.any().default({ name: 'KERS Global Freight Forwarding Inc.', address: '8200 NW 33rd Street, Miami, FL 33122 USA' }),
  consigneeId: z.string().nullish(),
  consignee: z.any().default({ name: 'General Consignee', address: '' }),
  notifyParty: z.any().optional(),

  agentId: z.string().nullish(),
  agentName: z.string().optional(),

  preCarriageBy: z.string().optional(),
  oceanVessel: z.string().optional().default(''),
  carrier: z.string().optional().default(''),
  portOfLoading: z.string().default('Port of Miami, USA (USMIA)'),
  portOfDischarge: z.string().default(''),
  placeOfDelivery: z.string().optional(),

  containerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  containerType: z.string().optional().default("40' High Cube"),
  marksAndNumbers: z.string().optional(),
  cargoDescription: z.string().optional().default('General Cargo'),

  packageCount: z.coerce.number().optional().default(0),
  totalPieces: z.coerce.number().optional().default(0),
  packageType: z.string().optional().default('Packages'),
  grossWeightLbs: z.coerce.number().optional().default(0),
  grossWeightKg: z.coerce.number().optional().default(0),
  cbm: z.coerce.number().optional().default(0),
  cft: z.coerce.number().optional().default(0),

  freightPayableAt: z.string().optional().default('Miami, FL'),
  freightTerms: z.string().optional().default('Freight Prepaid'),
  numberOfOriginals: z.string().optional().default('3 (THREE)'),

  holdDetails: z.any().optional().default({ isOnHold: false }),
  charges: z.array(z.any()).optional().default([]),
  totalFreightUsd: z.coerce.number().optional().default(0),
});

export const updateBillOfLadingSchema = createBillOfLadingSchema.partial();
