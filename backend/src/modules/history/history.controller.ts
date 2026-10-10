import { FastifyRequest, FastifyReply } from 'fastify';
import { HistoryService, historyService } from './history.service.js';
import { historyQuerySchema } from './history.schema.js';
import { successResponse } from '../../common/utils/response.js';
import { getPaginationParams, buildPaginationMeta } from '../../common/utils/pagination.js';

export class HistoryController {
  constructor(private readonly service: HistoryService = historyService) {}

  list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = historyQuerySchema.parse(request.query);
    const { page, limit, offset } = getPaginationParams(query);

    const { data, summary, total } = await this.service.getHistory({
      search: query.search,
      status: query.status,
      destinationCode: query.destinationCode,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      limit,
      offset,
    });

    const meta = buildPaginationMeta(total, page, limit);
    reply.send({
      success: true,
      data,
      summary,
      meta,
    });
  };

  getById = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const item = await this.service.getHistoryById(id);
    reply.send(successResponse(item));
  };

  exportCsv = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = historyQuerySchema.parse(request.query);
    const { data } = await this.service.getHistory({
      search: query.search,
      status: query.status,
      destinationCode: query.destinationCode,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      limit: 1000,
      offset: 0,
    });

    const headers = [
      'Shipment Number',
      'Tracking Number',
      'Status',
      'Flow Progress %',
      'Origin',
      'Destination Port',
      'Destination Code',
      'Carrier',
      'Vessel Name',
      'Voyage Number',
      'Container Number',
      'Container Type',
      'Seal Number',
      'B/L Number',
      'B/L Status',
      'Total Packages',
      'Total Weight (LBS)',
      'Total Weight (KG)',
      'Total Volume (CBM)',
      'Total Volume (CFT)',
      'Density (kg/CBM)',
      'Chargeable Weight (LBS)',
      'Est. Transit Days',
      'ETD',
      'ETA',
      'Created Date',
    ];

    const rows = data.map((s) => [
      `"${s.shipmentNumber}"`,
      `"${s.trackingNumber}"`,
      `"${s.status}"`,
      `${s.flowProgressPercent}%`,
      `"${s.origin}"`,
      `"${s.destinationPort}"`,
      `"${s.destinationCode}"`,
      `"${s.carrier || ''}"`,
      `"${s.vesselName || ''}"`,
      `"${s.voyageNumber || ''}"`,
      `"${s.containerNumber || ''}"`,
      `"${s.containerType || ''}"`,
      `"${s.sealNumber || ''}"`,
      `"${s.billOfLadingNumber || ''}"`,
      `"${s.blStatus || ''}"`,
      s.totalPackages,
      s.totalWeightLbs,
      s.totalWeightKg,
      s.totalCbm,
      s.totalCft,
      s.densityKgPerCbm,
      s.chargeableWeightLbs,
      s.estimatedTransitDays,
      `"${s.etd || ''}"`,
      `"${s.eta || ''}"`,
      `"${s.createdDate || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header(
        'Content-Disposition',
        `attachment; filename="KERS_Shipment_History_${new Date().toISOString().split('T')[0]}.csv"`
      )
      .send(csvContent);
  };
}

export const historyController = new HistoryController();
