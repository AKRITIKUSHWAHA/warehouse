import { FastifyRequest, FastifyReply } from 'fastify';
import { TrackingService, trackingService } from './tracking.service.js';
import { trackingLookupSchema } from './tracking.schema.js';
import { successResponse } from '../../common/utils/response.js';

export class TrackingController {
  constructor(private readonly service: TrackingService = trackingService) {}

  lookup = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { trackingNumber } = trackingLookupSchema.parse(request.params);
    const result = await this.service.track(trackingNumber);
    reply.send(successResponse(result));
  };

  listAll = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const result = await this.service.listAll();
    reply.send(successResponse(result));
  };
}

export const trackingController = new TrackingController();
