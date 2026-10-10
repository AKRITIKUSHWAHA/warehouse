import { FastifyRequest, FastifyReply } from 'fastify';
import { BillsOfLadingService, billsOfLadingService } from './bills-of-lading.service.js';
import { billOfLadingQuerySchema, holdActionSchema, createBillOfLadingSchema, updateBillOfLadingSchema } from './bills-of-lading.schema.js';
import { successResponse, paginatedResponse } from '../../common/utils/response.js';
import { getPaginationParams, buildPaginationMeta } from '../../common/utils/pagination.js';

export class BillsOfLadingController {
  constructor(private readonly service: BillsOfLadingService = billsOfLadingService) {}

  list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = billOfLadingQuerySchema.parse(request.query);
    const { page, limit, offset } = getPaginationParams(query);

    const { data, total } = await this.service.listBills({
      search: query.search,
      status: query.status,
      agentId: query.agentId,
      limit,
      offset,
    });

    const meta = buildPaginationMeta(total, page, limit);
    reply.send(paginatedResponse(data, meta));
  };

  getById = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const item = await this.service.getBill(id);
    reply.send(successResponse(item));
  };


  placeHold = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const body = holdActionSchema.parse(request.body);
    const currentUser = request.user.name || 'System User';

    const updated = await this.service.placeHold(id, {
      ...body,
      placedBy: currentUser,
    });

    reply.send(successResponse(updated, 'Bill of Lading placed ON HOLD successfully'));
  };

  clearHold = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const currentUser = request.user.name || 'System User';
    const body = (request.body as any) || {};

    const updated = await this.service.clearHold(
      id,
      currentUser,
      body.notes || body.clearanceNotes,
      body.authRef || body.reference || body.authorizationReference
    );
    reply.send(successResponse(updated, 'Hold cleared and Bill of Lading RELEASED successfully'));
  };

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as any;
    const user = request.user;

    const isValidUuid = (val: any): boolean =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const resolvedAgentId = isValidUuid(body.agentId)
      ? body.agentId
      : isValidUuid(user?.agentId)
        ? user.agentId
        : null;

    const newBLData = {
      blNumber: body.blNumber || `BL-VI-2026-${Math.floor(100 + Math.random() * 900)}`,
      type: body.type || 'Master Ocean Bill of Lading',
      status: body.status || 'Draft',
      createdDate: body.createdDate || body.issueDate || new Date().toISOString().split('T')[0],
      issueDate: body.issueDate || new Date().toISOString().split('T')[0],
      shipper: body.shipper || { name: body.shipperName || 'KERS Global Freight', address: body.shipperAddress || '' },
      consignee: body.consignee || { name: body.consigneeName || 'Nassau Distribution Ltd', address: body.consigneeAddress || '' },
      notifyParty: body.notifyParty || { name: body.notifyPartyName || 'Same as Consignee', address: '' },
      agentId: resolvedAgentId,
      agentName: body.agentName || (user?.roleKey === 'agent' ? user.name : 'Caribbean Express Freight Ltd.'),
      oceanVessel: body.oceanVessel || 'M/V Caribbean Voyager',
      voyageNumber: body.voyageNumber || 'VOY-2026-088',
      carrier: body.carrier || 'Tropical Shipping',
      portOfLoading: body.portOfLoading || 'Port of Miami, USA (USMIA)',
      portOfDischarge: body.portOfDischarge || 'NAS - Nassau Container Port',
      containerNumber: body.containerNumber || '',
      sealNumber: body.sealNumber || `BOLT-${Math.floor(10000 + Math.random() * 90000)}`,
      cargoDescription: body.cargoDescription || 'General Consignment: Commercial goods',
      packageCount: Number(body.packageCount) || 0,
      totalPieces: Number(body.totalPieces || body.packageCount) || 0,
      packageType: body.packageType || 'Packages',
      grossWeightLbs: String(body.grossWeightLbs || '0.00'),
      grossWeightKg: String(body.grossWeightKg || '0.00'),
      cbm: String(body.cbm || '0.00'),
      cft: String(body.cft || '0.00'),
      freightTerms: body.freightTerms || 'Freight Prepaid',
      holdDetails: body.holdDetails || { isOnHold: false },
      charges: body.charges || [],
      totalFreightUsd: String(body.totalFreightUsd || '0.00')
    };

    const item = await this.service.createBill(newBLData as any);
    reply.status(201).send(successResponse(item, 'Master Bill of Lading created successfully'));
  };

  update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const item = await this.service.updateBill(id, body);
    reply.send(successResponse(item, 'Master Bill of Lading updated successfully'));
  };

  delete = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const result = await this.service.deleteBill(id);
    reply.send(successResponse(result, 'Master Bill of Lading deleted successfully'));
  };
}

export const billsOfLadingController = new BillsOfLadingController();
