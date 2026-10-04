import { SettingsRepository, settingsRepository } from './settings.repository.js';
import { NotFoundError } from '../../common/errors/not-found-error.js';

export class SettingsService {
  constructor(private readonly repo: SettingsRepository = settingsRepository) {}

  async getAllSettings() {
    const list = await this.repo.findAll();
    const map: Record<string, unknown> = {};
    for (const item of list) {
      map[item.key] = item.value;
    }
    return map;
  }

  async getSetting(key: string) {
    const item = await this.repo.findByKey(key);
    if (!item) throw new NotFoundError(`Setting '${key}'`);
    return item.value;
  }

  async updateSetting(key: string, value: Record<string, unknown>, description?: string) {
    return this.repo.upsert(key, value, description);
  }

  async cleanSlate(userId?: string, userName?: string, userRole?: string, ipAddress?: string) {
    return this.repo.cleanSlate(userId, userName, userRole, ipAddress);
  }
}

export const settingsService = new SettingsService();
