import { FastifyRequest, FastifyReply } from 'fastify';
import { VesselsService, vesselsService } from './vessels.service.js';
import { vesselQuerySchema, createVesselSchema, updateVesselSchema } from './vessels.schema.js';
import { successResponse, paginatedResponse } from '../../common/utils/response.js';
import { getPaginationParams, buildPaginationMeta } from '../../common/utils/pagination.js';

export class VesselsController {
  constructor(private readonly service: VesselsService = vesselsService) {}

  list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = vesselQuerySchema.parse(request.query);
    const { page, limit, offset } = getPaginationParams(query);

    const { data, total } = await this.service.listVessels({
      search: query.search,
      limit,
      offset,
    });

    const meta = buildPaginationMeta(total, page, limit);
    reply.send(paginatedResponse(data, meta));
  };

  getById = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const item = await this.service.getVessel(id);
    reply.send(successResponse(item));
  };

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = createVesselSchema.parse(request.body);
    const created = await this.service.createVessel(body);
    reply.status(201).send(successResponse(created, 'Vessel created successfully'));
  };

  update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const body = updateVesselSchema.parse(request.body);
    const updated = await this.service.updateVessel(id, body);
    reply.send(successResponse(updated, 'Vessel updated successfully'));
  };

  delete = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    await this.service.deleteVessel(id);
    reply.send(successResponse(null, 'Vessel deleted successfully'));
  };
}


export const vesselsController = new VesselsController();
