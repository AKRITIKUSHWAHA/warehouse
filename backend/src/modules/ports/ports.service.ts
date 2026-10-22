import { PortsRepository, portsRepository } from './ports.repository.js';
import { CreatePortInput, UpdatePortInput } from './ports.types.js';
import { NotFoundError } from '../../common/errors/not-found-error.js';

export class PortsService {
  constructor(private readonly repo: PortsRepository = portsRepository) {}

  async listPorts() {
    return this.repo.findAll();
  }

  async getPort(idOrCode: string) {
    const port = await this.repo.findByIdOrCode(idOrCode);
    if (!port) throw new NotFoundError('Port');
    return port;
  }

  async createPort(input: CreatePortInput) {
    return this.repo.create(input);
  }

  async updatePort(idOrCode: string, input: UpdatePortInput) {
    const existing = await this.repo.findByIdOrCode(idOrCode);
    if (!existing) {
      return this.repo.create({
        portCode: input.portCode || idOrCode.replace(/^PORT-/, '').toUpperCase(),
        name: input.name || `${idOrCode} Port`,
        country: input.country || 'Bahamas',
        island: input.island || undefined,
        defaultAgent: input.defaultAgent || undefined,
        status: input.status || 'Active',
      });
    }
    return this.repo.update(idOrCode, input);
  }

  async deletePort(idOrCode: string) {
    const existing = await this.repo.findByIdOrCode(idOrCode);
    if (!existing) {
      return null;
    }
    return this.repo.delete(idOrCode);
  }
}

export const portsService = new PortsService();
