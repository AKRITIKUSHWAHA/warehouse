import { VoyagesRepository, voyagesRepository } from './voyages.repository.js';
import { VoyageFilterParams } from './voyages.types.js';
import { NotFoundError } from '../../common/errors/not-found-error.js';
import { vesselsRepository } from '../vessels/vessels.repository.js';

export class VoyagesService {
  constructor(private readonly repo: VoyagesRepository = voyagesRepository) {}

  async listVoyages(filters: VoyageFilterParams) {
    return this.repo.findMany(filters);
  }

  async getVoyage(idOrNumber: string) {
    const item = await this.repo.findByIdOrNumber(idOrNumber);
    if (!item) throw new NotFoundError('Voyage');
    return item;
  }

  async createVoyage(input: Record<string, unknown>) {
    let vesselId = input.vesselId as string | undefined;
    if (vesselId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vesselId)) {
      vesselId = undefined;
    }
    if (!vesselId && typeof input.vesselName === 'string') {
      const { data: matchedVessels } = await vesselsRepository.findMany({
        search: input.vesselName,
        limit: 1,
        offset: 0,
      });
      if (matchedVessels && matchedVessels.length > 0) {
        vesselId = matchedVessels[0].id;
      }
    }

    return this.repo.create({
      ...input,
      vesselId: vesselId || null,
    });
  }

  async updateVoyage(id: string, input: Record<string, unknown>) {
    await this.getVoyage(id);

    let vesselId = input.vesselId as string | undefined;
    if (vesselId !== undefined) {
      if (vesselId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vesselId)) {
        vesselId = undefined;
      }
    } else if (typeof input.vesselName === 'string') {
      const { data: matchedVessels } = await vesselsRepository.findMany({
        search: input.vesselName,
        limit: 1,
        offset: 0,
      });
      if (matchedVessels && matchedVessels.length > 0) {
        vesselId = matchedVessels[0].id;
      }
    }

    const payload = { ...input };
    if (vesselId !== undefined) {
      payload.vesselId = vesselId || null;
    }

    return this.repo.update(id, payload);
  }

  async deleteVoyage(id: string) {
    await this.getVoyage(id);
    return this.repo.delete(id);
  }
}

export const voyagesService = new VoyagesService();
