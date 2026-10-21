import { FastifyRequest, FastifyReply } from 'fastify';
import { ManifestsService, manifestsService } from './manifests.service.js';
import { manifestQuerySchema, createManifestSchema, updateManifestSchema } from './manifests.schema.js';
import { successResponse, paginatedResponse } from '../../common/utils/response.js';
import { getPaginationParams, buildPaginationMeta } from '../../common/utils/pagination.js';

export class ManifestsController {
  constructor(private readonly service: ManifestsService = manifestsService) {}

  list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = manifestQuerySchema.parse(request.query);
    const { page, limit, offset } = getPaginationParams(query);

    const { data, total } = await this.service.listManifests({
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
    const item = await this.service.getManifest(id);
    reply.send(successResponse(item));
  };

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = createManifestSchema.parse(request.body);
    const created = await this.service.createManifest(body);
    reply.status(201).send(successResponse(created, 'Shipping manifest created successfully'));
  };

  createFromMasterBL = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { blId } = request.params as { blId: string };
    const created = await this.service.createFromMasterBL(blId);
    reply.status(201).send(successResponse(created, 'Shipping manifest generated successfully from Master B/L'));
  };

  update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const body = updateManifestSchema.parse(request.body);
    const updated = await this.service.updateManifest(id, body);
    reply.send(successResponse(updated, 'Shipping manifest updated successfully'));
  };

  delete = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    await this.service.deleteManifest(id);
    reply.send(successResponse(null, 'Shipping manifest deleted successfully'));
  };
}

export const manifestsController = new ManifestsController();
