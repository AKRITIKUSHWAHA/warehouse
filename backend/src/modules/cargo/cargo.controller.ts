import { FastifyRequest, FastifyReply } from 'fastify';
import { CargoService, cargoService } from './cargo.service.js';
import { cargoQuerySchema, createCargoSchema, updateCargoSchema } from './cargo.schema.js';
import { successResponse, paginatedResponse, createdResponse } from '../../common/utils/response.js';
import { getPaginationParams, buildPaginationMeta } from '../../common/utils/pagination.js';

export class CargoController {
  constructor(private readonly service: CargoService = cargoService) {}

  list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = cargoQuerySchema.parse(request.query);
    const { page, limit, offset } = getPaginationParams(query);

    const { data, total } = await this.service.listCargo({
      search: query.search,
      status: query.status,
      destinationCode: query.destinationCode,
      warehouseReceiptId: query.warehouseReceiptId,
      agentId: query.agentId,
      limit,
      offset,
    });

    const meta = buildPaginationMeta(total, page, limit);
    reply.send(paginatedResponse(data, meta));
  };

  getById = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const item = await this.service.getCargo(id);
    reply.send(successResponse(item));
  };

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = createCargoSchema.parse(request.body);
    const item = await this.service.createCargo(body);
    reply.status(201).send(createdResponse(item));
  };

  update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const body = updateCargoSchema.parse(request.body);
    const item = await this.service.updateCargo(id, body);
    reply.send(successResponse(item));
  };

  delete = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const success = await this.service.deleteCargo(id);
    reply.send(successResponse({ success }));
  };
}

export const cargoController = new CargoController();
