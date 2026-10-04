import { FastifyRequest, FastifyReply } from 'fastify';
import { VoyagesService, voyagesService } from './voyages.service.js';
import { voyageQuerySchema, createVoyageSchema, updateVoyageSchema } from './voyages.schema.js';
import { successResponse, paginatedResponse, createdResponse } from '../../common/utils/response.js';
import { getPaginationParams, buildPaginationMeta } from '../../common/utils/pagination.js';

export class VoyagesController {
  constructor(private readonly service: VoyagesService = voyagesService) {}

  list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = voyageQuerySchema.parse(request.query);
    const { page, limit, offset } = getPaginationParams(query);

    const { data, total } = await this.service.listVoyages({
      search: query.search,
      status: query.status,
      limit,
      offset,
    });

    const meta = buildPaginationMeta(total, page, limit);
    reply.send(paginatedResponse(data, meta));
  };

  getById = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const item = await this.service.getVoyage(id);
    reply.send(successResponse(item));
  };

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = createVoyageSchema.parse(request.body);
    const item = await this.service.createVoyage(body);
    reply.status(201).send(createdResponse(item));
  };

  update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const body = updateVoyageSchema.parse(request.body);
    const item = await this.service.updateVoyage(id, body);
    reply.send(successResponse(item));
  };

  delete = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const success = await this.service.deleteVoyage(id);
    reply.send(successResponse({ success }));
  };
}

export const voyagesController = new VoyagesController();

