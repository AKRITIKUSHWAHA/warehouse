import { FastifyRequest, FastifyReply } from 'fastify';
import { SettingsService, settingsService } from './settings.service.js';
import { updateSettingSchema } from './settings.schema.js';
import { successResponse } from '../../common/utils/response.js';

export class SettingsController {
  constructor(private readonly service: SettingsService = settingsService) {}

  getAll = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const settings = await this.service.getAllSettings();
    reply.send(successResponse(settings));
  };

  getByKey = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { key } = request.params as { key: string };
    const value = await this.service.getSetting(key);
    reply.send(successResponse(value));
  };

  update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { key } = request.params as { key: string };
    const body = updateSettingSchema.parse(request.body);
    const updated = await this.service.updateSetting(key, body.value, body.description);
    reply.send(successResponse(updated, 'Settings updated successfully'));
  };

  cleanSlate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = request.user as { id?: string; name?: string; roleKey?: string } | undefined;
    await this.service.cleanSlate(user?.id, user?.name, user?.roleKey, request.ip);
    reply.send(successResponse({ success: true }, 'Transactional data cleared successfully (audit logs preserved)'));
  };
}

export const settingsController = new SettingsController();
