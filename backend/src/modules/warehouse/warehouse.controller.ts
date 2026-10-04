import { FastifyRequest, FastifyReply } from 'fastify';
import { WarehouseService, warehouseService } from './warehouse.service.js';
import {
  createWarehouseReceiptSchema,
  updateWarehouseReceiptSchema,
  warehouseReceiptQuerySchema,
} from './warehouse.schema.js';
import { successResponse, paginatedResponse } from '../../common/utils/response.js';
import { getPaginationParams, buildPaginationMeta } from '../../common/utils/pagination.js';

export class WarehouseController {
  constructor(private readonly service: WarehouseService = warehouseService) {}

  list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = warehouseReceiptQuerySchema.parse(request.query);
    const { page, limit, offset } = getPaginationParams(query);

    const { data, total } = await this.service.listReceipts({
      search: query.search,
      status: query.status,
      destinationCode: query.destinationCode,
      customerId: query.customerId,
      agentId: query.agentId,
      limit,
      offset,
    });

    const meta = buildPaginationMeta(total, page, limit);
    reply.send(paginatedResponse(data, meta));
  };

  getNextNumber = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const nextSeq = await this.service.getNextNumber();
    reply.send(successResponse({ nextReceiptNumber: String(nextSeq), nextSequenceNumber: nextSeq }));
  };

  getById = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const receipt = await this.service.getReceipt(id);
    reply.send(successResponse(receipt));
  };

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = createWarehouseReceiptSchema.parse(request.body);
    const created = await this.service.createReceipt(body);
    reply.status(201).send(successResponse(created, 'Warehouse Receipt created successfully'));
  };

  update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const body = updateWarehouseReceiptSchema.parse(request.body);
    const updated = await this.service.updateReceipt(id, body, request.user?.roleKey);
    reply.send(successResponse(updated, 'Warehouse Receipt updated successfully'));
  };

  delete = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    await this.service.deleteReceipt(id);
    reply.send(successResponse(null, 'Warehouse Receipt deleted successfully'));
  };
}

export const warehouseController = new WarehouseController();
