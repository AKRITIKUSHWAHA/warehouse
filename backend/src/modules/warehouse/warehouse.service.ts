import { WarehouseRepository, warehouseRepository } from './warehouse.repository.js';
import { WarehouseReceiptFilterParams, CreateWarehouseReceiptInput, UpdateWarehouseReceiptInput } from './warehouse.types.js';
import { NotFoundError } from '../../common/errors/not-found-error.js';
import { ForbiddenError } from '../../common/errors/forbidden-error.js';
import { calculateDimensions, convertLbsToKg } from '../../common/utils/calculations.js';
import { db } from '../../db/index.js';
import { cargo, customers } from '../../db/schema/index.js';
import { eq, or } from 'drizzle-orm';


export class WarehouseService {
  constructor(private readonly repo: WarehouseRepository = warehouseRepository) {}

  async listReceipts(filters: WarehouseReceiptFilterParams) {
    return this.repo.findMany(filters);
  }

  async getReceipt(idOrReceiptNumber: string) {
    const receipt = await this.repo.findByIdOrReceiptNumber(idOrReceiptNumber);
    if (!receipt) {
      throw new NotFoundError('Warehouse Receipt');
    }
    return receipt;
  }

  async getNextNumber(): Promise<number> {
    return this.repo.getNextSequenceNumber();
  }

  async createReceipt(input: CreateWarehouseReceiptInput & { receiptNumber?: string; sequenceNumber?: number; totalPieces?: number; customer?: string | null }) {
    let nextSeq: number;
    if (input.sequenceNumber && !isNaN(Number(input.sequenceNumber))) {
      nextSeq = Number(input.sequenceNumber);
    } else if (input.receiptNumber && !isNaN(Number(input.receiptNumber))) {
      nextSeq = Number(input.receiptNumber);
    } else {
      nextSeq = await this.repo.getNextSequenceNumber();
    }

    const receiptNumber = input.receiptNumber || String(nextSeq);

    let packages = input.packages ?? [];
    if (packages.length === 0) {
      const length = Number(input.lengthInches) || 0;
      const width = Number(input.widthInches) || 0;
      const height = Number(input.heightInches) || 0;
      const weight = Number(input.weightLbs) || 0;
      const { cft, cbm } = calculateDimensions(length, width, height, 1);

      packages = [
        {
          id: `PKG-${receiptNumber}-01`,
          packageType: input.packageType || 'Carton',
          description: input.cargoDescription || 'General Cargo',
          lengthInches: length,
          widthInches: width,
          heightInches: height,
          weightLbs: weight,
          pieces: 1,
          cft,
          cbm,
        },
      ];
    }

    let totalPieces = 0;
    let totalWeightLbs = 0;
    let totalCft = 0;
    let totalCbm = 0;

    for (const pkg of packages) {
      totalPieces += Number(pkg.pieces) || 1;
      totalWeightLbs += Number(pkg.weightLbs) || 0;
      totalCft += Number(pkg.cft) || 0;
      totalCbm += Number(pkg.cbm) || 0;
    }

    if (totalPieces === 0 && input.totalPieces) {
      totalPieces = Number(input.totalPieces);
    }

    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const validCustomerId = input.customerId && UUID_REGEX.test(input.customerId) ? input.customerId : null;
    const validAgentId = input.agentId && UUID_REGEX.test(input.agentId) ? input.agentId : null;

    const totalWeightKg = Number((totalWeightLbs * 0.453592).toFixed(1));
    const destCode = input.destinationCode || (input.destinationPort ? (input.destinationPort.includes(' - ') ? input.destinationPort.split(' - ')[0].trim() : input.destinationPort.slice(0, 3).toUpperCase()) : 'NAS');
    const customerDisplayName = input.customerName || (input as any).customer || 'General Cargo';

    const created = await this.repo.create({
      receiptNumber,
      sequenceNumber: nextSeq,
      date: input.date || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerId: validCustomerId,
      customerName: customerDisplayName,
      shipper: input.shipper || '',
      consignee: input.consignee || '',
      agentId: validAgentId,
      agentName: input.agentName || '',
      destinationPort: input.destinationPort || 'NAS - Nassau Container Port',
      destinationCode: destCode,
      cargoDescription: input.cargoDescription || 'General Cargo',
      packageCount: packages.length,
      totalPieces: totalPieces || 1,
      packageType: input.packageType || (packages[0]?.packageType as string) || 'Carton',
      packages,
      lengthInches: input.lengthInches ? String(input.lengthInches) : null,
      widthInches: input.widthInches ? String(input.widthInches) : null,
      heightInches: input.heightInches ? String(input.heightInches) : null,
      weightLbs: String(totalWeightLbs),
      weightKg: String(totalWeightKg),
      totalCft: String(totalCft.toFixed(2)),
      totalCbm: String(totalCbm.toFixed(2)),
      warehouseLocation: input.warehouseLocation || 'Bay A-1 (CFS Staging)',
      status: input.status || 'Ready for Consolidation',
      hazardous: input.hazardous ?? false,
      fragile: input.fragile ?? false,
      notes: input.notes || '',
      barcode: `WR${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      qrCode: `VI-${receiptNumber}-${destCode}-${totalPieces}PK`,
    });

    // Also populate cargo inventory table
    try {
      const UUID_REGEX_STRICT = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      const safeAgentId = created.agentId && UUID_REGEX_STRICT.test(created.agentId) ? created.agentId : null;
      await db
        .insert(cargo)
        .values({
          cargoNumber: `CRG-${receiptNumber}-01`,
          warehouseReceiptId: created.id,
          receiptNumber: created.receiptNumber,
          customer: created.customerName,
          description: created.cargoDescription || (packages[0]?.description as string) || 'General Cargo',
          packageCount: created.packageCount,
          totalPieces: created.totalPieces,
          packageType: created.packageType,
          lengthInches: created.lengthInches,
          widthInches: created.widthInches,
          heightInches: created.heightInches,
          weightLbs: created.weightLbs,
          weightKg: created.weightKg,
          cft: created.totalCft,
          cbm: created.totalCbm,
          warehouseLocation: created.warehouseLocation,
          destinationPort: created.destinationPort,
          destinationCode: created.destinationCode,
          agentId: safeAgentId,
          agentName: created.agentName,
          status: created.status,
          barcode: `CRG${Math.floor(10000000 + Math.random() * 90000000)}`,
          qrCode: `VI-CRG-${created.receiptNumber}`,
        });
    } catch (cargoErr) {
      console.error('Cargo sync failed for WR', created.receiptNumber, cargoErr);
    }

    return created;
  }


  async updateReceipt(id: string, input: UpdateWarehouseReceiptInput, userRole?: string) {
    const existing = await this.getReceipt(id);

    // Only Documentation and Super Admin can edit receiptNumber manually
    if (input.receiptNumber && input.receiptNumber !== existing.receiptNumber) {
      if (userRole !== 'super_admin' && userRole !== 'documentation') {
        throw new ForbiddenError('Only Documentation Staff or Super Admin can modify the Receipt Number.');
      }
    }

    const updated = await this.repo.update(id, input);

    // Synchronize matching cargo record
    if (updated) {
      try {
        const cargoUpdates: Record<string, unknown> = { updatedAt: new Date() };
        if (input.customerName || (input as any).customer) {
          cargoUpdates.customer = input.customerName || (input as any).customer;
        }
        if (input.cargoDescription) {
          cargoUpdates.description = input.cargoDescription;
        }
        if (input.weightLbs !== undefined) {
          cargoUpdates.weightLbs = String(input.weightLbs);
        }
        if (input.weightKg !== undefined) {
          cargoUpdates.weightKg = String(input.weightKg);
        }
        if ((input as any).totalCft !== undefined) {
          cargoUpdates.cft = String((input as any).totalCft);
        }
        if ((input as any).totalCbm !== undefined) {
          cargoUpdates.cbm = String((input as any).totalCbm);
        }
        if (input.warehouseLocation) {
          cargoUpdates.warehouseLocation = input.warehouseLocation;
        }

        await db
          .update(cargo)
          .set(cargoUpdates)
          .where(eq(cargo.warehouseReceiptId, existing.id));
      } catch (syncErr) {
        console.warn('Notice syncing cargo on WR update:', syncErr);
      }
    }

    return updated;
  }

  async deleteReceipt(id: string) {
    await this.getReceipt(id);
    return this.repo.delete(id);
  }
}

export const warehouseService = new WarehouseService();
