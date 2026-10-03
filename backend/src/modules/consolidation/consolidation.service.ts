import { ConsolidationRepository, consolidationRepository } from './consolidation.repository.js';
import { ConsolidationFilterParams, CreateConsolidationInput, UpdateConsolidationInput } from './consolidation.types.js';
import { NotFoundError } from '../../common/errors/not-found-error.js';
import { convertLbsToKg } from '../../common/utils/calculations.js';
import { db } from '../../db/index.js';
import { warehouseReceipts, houseBills, cargo } from '../../db/schema/index.js';
import { eq, or, inArray } from 'drizzle-orm';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class ConsolidationService {
  constructor(private readonly repo: ConsolidationRepository = consolidationRepository) {}

  async listConsolidations(filters: ConsolidationFilterParams) {
    return this.repo.findMany(filters);
  }

  async getConsolidation(idOrNumber: string) {
    const item = await this.repo.findByIdOrNumber(idOrNumber);
    if (!item) throw new NotFoundError('Consolidation');
    return item;
  }

  async createConsolidation(input: CreateConsolidationInput) {
    const totalCount = await this.repo.countTotal();
    const seq = String(totalCount + 1).padStart(4, '0');
    const consolidationNumber = input.consolidationNumber && input.consolidationNumber.trim()
      ? input.consolidationNumber.trim()
      : `CNS-2026-${seq}`;

    const createdDate = input.createdDate || new Date().toISOString().split('T')[0];
    const destinationPort = input.destinationPort || 'NAS - Nassau Container Port';
    const dischargePort = input.dischargePort || destinationPort;
    const loadingPort = input.loadingPort || 'Port of Miami (USMIA)';
    const title = input.title || `Consolidation - ${destinationPort} (${createdDate})`;

    const validContainerId = input.containerId && UUID_REGEX.test(input.containerId) ? input.containerId : null;
    const validVesselId = input.vesselId && UUID_REGEX.test(input.vesselId) ? input.vesselId : null;
    const validVoyageId = input.voyageId && UUID_REGEX.test(input.voyageId) ? input.voyageId : null;

    const weightLbs = Number(input.totalWeightLbs) || 0;
    const weightKg = input.totalWeightKg ? Number(input.totalWeightKg) : convertLbsToKg(weightLbs);

    const created = await this.repo.create({
      consolidationNumber,
      title,
      destinationPort,
      destinationCode: input.destinationCode || 'NAS',
      createdDate,
      status: input.status || 'Planning',
      containerId: validContainerId,
      containerNumber: input.containerNumber || null,
      containerType: input.containerType || "40' Standard Dry",
      containerCapacityCbm: input.containerCapacityCbm ? String(Number(input.containerCapacityCbm).toFixed(2)) : '67.70',
      sealNumber: input.sealNumber || null,
      vesselId: validVesselId,
      vesselName: input.vesselName || null,
      voyageId: validVoyageId,
      voyageNumber: input.voyageNumber || null,
      carrier: input.carrier || 'Tropical Shipping Line',
      loadingPort,
      dischargePort,
      totalHouseBills: Number(input.totalHouseBills) || (input.houseBillIds?.length || 0),
      houseBillIds: input.houseBillIds || [],
      totalReceipts: Number(input.totalReceipts) || (input.receiptIds?.length || 0),
      receiptIds: input.receiptIds || [],
      totalPackages: Number(input.totalPackages) || 0,
      totalPieces: Number(input.totalPieces) || Number(input.totalPackages) || 0,
      totalWeightLbs: String(weightLbs.toFixed(2)),
      totalWeightKg: String(weightKg.toFixed(2)),
      totalCft: String((Number(input.totalCft) || 0).toFixed(2)),
      totalCbm: String((Number(input.totalCbm) || 0).toFixed(2)),
      containerFillPercentage: String((Number(input.containerFillPercentage) || 0).toFixed(2)),
      assignedShipmentId: input.assignedShipmentId || null,
      assignedMasterBLId: input.assignedMasterBLId || null,
      agentId: input.agentId || null,
      agentName: input.agentName || null,
      notes: input.notes || null,
    });

    // Relational sync: Link Warehouse Receipts in database
    if (input.receiptIds && input.receiptIds.length > 0) {
      try {
        const uuidIds = input.receiptIds.filter(id => UUID_REGEX.test(id));
        const wrConditions = [];
        if (uuidIds.length > 0) wrConditions.push(inArray(warehouseReceipts.id, uuidIds));
        wrConditions.push(inArray(warehouseReceipts.receiptNumber, input.receiptIds));

        await db
          .update(warehouseReceipts)
          .set({
            assignedConsolidationId: created.consolidationNumber,
            status: 'Consolidated',
            updatedAt: new Date()
          })
          .where(or(...wrConditions));

        await db
          .update(cargo)
          .set({
            status: 'Consolidated',
            updatedAt: new Date()
          })
          .where(inArray(cargo.receiptNumber, input.receiptIds));
      } catch (relErr) {
        console.warn('Notice linking warehouse receipts to consolidation:', relErr);
      }
    }

    // Relational sync: Link House Bills in database
    if (input.houseBillIds && input.houseBillIds.length > 0) {
      try {
        const uuidIds = input.houseBillIds.filter(id => UUID_REGEX.test(id));
        const hbConditions = [];
        if (uuidIds.length > 0) hbConditions.push(inArray(houseBills.id, uuidIds));
        hbConditions.push(inArray(houseBills.hblNumber, input.houseBillIds));

        await db
          .update(houseBills)
          .set({
            assignedConsolidationId: created.consolidationNumber,
            status: 'Consolidated',
            updatedAt: new Date()
          })
          .where(or(...hbConditions));
      } catch (hbErr) {
        console.warn('Notice linking house bills to consolidation:', hbErr);
      }
    }

    return created;
  }

  async updateConsolidation(id: string, input: UpdateConsolidationInput) {
    const existing = await this.getConsolidation(id);

    const updatePayload: Record<string, unknown> = { ...input };
    if (input.containerId !== undefined) {
      updatePayload.containerId = input.containerId && UUID_REGEX.test(input.containerId) ? input.containerId : null;
    }
    if (input.vesselId !== undefined) {
      updatePayload.vesselId = input.vesselId && UUID_REGEX.test(input.vesselId) ? input.vesselId : null;
    }
    if (input.voyageId !== undefined) {
      updatePayload.voyageId = input.voyageId && UUID_REGEX.test(input.voyageId) ? input.voyageId : null;
    }
    if (input.totalWeightLbs !== undefined) {
      updatePayload.totalWeightLbs = String((Number(input.totalWeightLbs) || 0).toFixed(2));
    }
    if (input.totalWeightKg !== undefined) {
      updatePayload.totalWeightKg = String((Number(input.totalWeightKg) || 0).toFixed(2));
    }
    if (input.totalCft !== undefined) {
      updatePayload.totalCft = String((Number(input.totalCft) || 0).toFixed(2));
    }
    if (input.totalCbm !== undefined) {
      updatePayload.totalCbm = String((Number(input.totalCbm) || 0).toFixed(2));
    }
    if (input.containerCapacityCbm !== undefined) {
      updatePayload.containerCapacityCbm = String((Number(input.containerCapacityCbm) || 67.7).toFixed(2));
    }
    if (input.containerFillPercentage !== undefined) {
      updatePayload.containerFillPercentage = String((Number(input.containerFillPercentage) || 0).toFixed(2));
    }

    const updated = await this.repo.update(id, updatePayload);

    // Sync status down to linked receipts/HBLs if changed to Sealed, In Transit, etc.
    if (input.status && existing && (input.status === 'Sealed' || input.status === 'In Transit' || input.status === 'Completed')) {
      try {
        await db
          .update(warehouseReceipts)
          .set({ status: input.status === 'In Transit' ? 'In Transit' : 'Consolidated', updatedAt: new Date() })
          .where(
            or(
              eq(warehouseReceipts.assignedConsolidationId, existing.id),
              eq(warehouseReceipts.assignedConsolidationId, existing.consolidationNumber)
            )
          );
      } catch (stErr) {
        console.warn('Notice updating linked receipts status:', stErr);
      }
    }

    return updated;
  }

  async deleteConsolidation(id: string) {
    const existing = await this.getConsolidation(id);
    if (existing) {
      try {
        // Unlink assignedConsolidationId from warehouse receipts in database
        await db
          .update(warehouseReceipts)
          .set({
            assignedConsolidationId: null,
            status: 'Ready for Consolidation',
            updatedAt: new Date()
          })
          .where(
            or(
              eq(warehouseReceipts.assignedConsolidationId, existing.id),
              eq(warehouseReceipts.assignedConsolidationId, existing.consolidationNumber)
            )
          );

        // Unlink assignedConsolidationId from house bills in database
        await db
          .update(houseBills)
          .set({
            assignedConsolidationId: null,
            status: 'Active',
            updatedAt: new Date()
          })
          .where(
            or(
              eq(houseBills.assignedConsolidationId, existing.id),
              eq(houseBills.assignedConsolidationId, existing.consolidationNumber)
            )
          );

        // Reset cargo status if receiptIds exist
        if (existing.receiptIds && Array.isArray(existing.receiptIds) && existing.receiptIds.length > 0) {
          const rIds = existing.receiptIds.filter((r): r is string => typeof r === 'string');
          if (rIds.length > 0) {
            await db
              .update(cargo)
              .set({
                status: 'Ready for Consolidation',
                updatedAt: new Date()
              })
              .where(inArray(cargo.receiptNumber, rIds));
          }
        }
      } catch (unlinkErr) {
        console.warn('Notice unlinking related records on consolidation delete:', unlinkErr);
      }
    }
    return this.repo.delete(id);
  }
}

export const consolidationService = new ConsolidationService();
