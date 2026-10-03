import { CargoRepository, cargoRepository } from './cargo.repository.js';
import { CargoFilterParams, CreateCargoInput, UpdateCargoInput } from './cargo.types.js';
import { NotFoundError } from '../../common/errors/not-found-error.js';
import { calculateCft, calculateCbmFromCft, convertLbsToKg } from '../../common/utils/calculations.js';

export class CargoService {
  constructor(private readonly repo: CargoRepository = cargoRepository) {}

  async listCargo(filters: CargoFilterParams) {
    return this.repo.findMany(filters);
  }

  async getCargo(id: string) {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundError('Cargo');
    return item;
  }

  async createCargo(input: CreateCargoInput) {
    const cargoNum = input.cargoNumber || input.id || `CRG-${Math.floor(1000 + Math.random() * 9000)}-01`;
    const pkgCount = Number(input.packageCount) || 1;
    const l = Number(input.lengthInches) || 0;
    const w = Number(input.widthInches) || 0;
    const h = Number(input.heightInches) || 0;
    const weightLbs = Number(input.weightLbs) || 0;

    let cft = Number(input.cft) || 0;
    let cbm = Number(input.cbm) || 0;
    if (l && w && h && (!cft || !cbm)) {
      cft = calculateCft(l, w, h, pkgCount);
      cbm = calculateCbmFromCft(cft);
    }
    const weightKg = Number(input.weightKg) || convertLbsToKg(weightLbs);
    const destPort = input.destinationPort || 'NAS - Nassau, Bahamas';
    const destCode = input.destinationCode || (destPort.includes(' - ') ? destPort.split(' - ')[0].trim() : 'NAS');

    return this.repo.create({
      cargoNumber: cargoNum,
      warehouseReceiptId: input.warehouseReceiptId || null,
      receiptNumber: input.receiptNumber || `WR-${Math.floor(3100 + Math.random() * 900)}`,
      customer: input.customer,
      description: input.description,
      packageCount: pkgCount,
      totalPieces: Number(input.totalPieces) || pkgCount,
      packageType: input.packageType || 'Cartons',
      lengthInches: l ? String(l) : null,
      widthInches: w ? String(w) : null,
      heightInches: h ? String(h) : null,
      weightLbs: String(weightLbs),
      weightKg: String(weightKg),
      cft: String(cft.toFixed(2)),
      cbm: String(cbm.toFixed(2)),
      warehouseLocation: input.warehouseLocation || 'Bay A-01',
      destinationPort: destPort,
      destinationCode: destCode,
      agentId: input.agentId || null,
      agentName: input.agentName || null,
      status: input.status || 'Ready for Consolidation',
      barcode: input.barcode || `CRG${Math.floor(10000000 + Math.random() * 90000000)}`,
      qrCode: input.qrCode || `VI-${cargoNum}`,
    });
  }

  async updateCargo(id: string, input: UpdateCargoInput) {
    const existing = await this.getCargo(id);
    const updateValues: Record<string, unknown> = { ...input };

    if (input.lengthInches !== undefined) updateValues.lengthInches = input.lengthInches ? String(input.lengthInches) : null;
    if (input.widthInches !== undefined) updateValues.widthInches = input.widthInches ? String(input.widthInches) : null;
    if (input.heightInches !== undefined) updateValues.heightInches = input.heightInches ? String(input.heightInches) : null;
    if (input.weightLbs !== undefined) {
      updateValues.weightLbs = String(input.weightLbs);
      updateValues.weightKg = String(convertLbsToKg(Number(input.weightLbs)));
    }
    if (input.cft !== undefined) updateValues.cft = String(input.cft);
    if (input.cbm !== undefined) updateValues.cbm = String(input.cbm);

    return this.repo.update(id, updateValues);
  }

  async deleteCargo(id: string) {
    await this.getCargo(id);
    return this.repo.delete(id);
  }
}

export const cargoService = new CargoService();
