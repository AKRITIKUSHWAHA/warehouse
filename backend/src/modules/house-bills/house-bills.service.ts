import { HouseBillsRepository, houseBillsRepository } from './house-bills.repository.js';
import { HouseBillFilterParams, CreateHouseBillInput } from './house-bills.types.js';
import { NotFoundError } from '../../common/errors/not-found-error.js';
import { BadRequestError } from '../../common/errors/bad-request-error.js';
import { db } from '../../db/index.js';
import { customers, warehouseReceipts } from '../../db/schema/index.js';
import { eq, or, inArray } from 'drizzle-orm';

function hydrateHbl(hbl: any) {
  if (!hbl) return hbl;
  if (hbl.notes && typeof hbl.notes === 'string' && hbl.notes.includes('---FREIGHT_CHARGES---')) {
    const parts = hbl.notes.split('\n---FREIGHT_CHARGES---\n');
    hbl.notes = parts[0];
    try {
      hbl.freightCharges = JSON.parse(parts[1]);
      hbl.charges = hbl.freightCharges;
    } catch {
      // ignore json parse error
    }
  }
  return hbl;
}

export class HouseBillsService {
  constructor(private readonly repo: HouseBillsRepository = houseBillsRepository) {}

  async listHouseBills(filters: HouseBillFilterParams) {
    const res = await this.repo.findMany(filters);
    res.data = res.data.map(hydrateHbl);
    return res;
  }

  async getHouseBill(idOrHblNumber: string) {
    const hbl = await this.repo.findByIdOrHblNumber(idOrHblNumber);
    if (!hbl) throw new NotFoundError('House Bill of Lading');
    return hydrateHbl(hbl);
  }

  async createHouseBill(input: CreateHouseBillInput) {
    // Validate that attached warehouse receipts are eligible (not already assigned or consolidated)
    if (input.warehouseReceiptIds && input.warehouseReceiptIds.length > 0) {
      const existingWrs = await db
        .select({
          id: warehouseReceipts.id,
          receiptNumber: warehouseReceipts.receiptNumber,
          status: warehouseReceipts.status,
          assignedHouseBillId: warehouseReceipts.assignedHouseBillId,
        })
        .from(warehouseReceipts)
        .where(inArray(warehouseReceipts.receiptNumber, input.warehouseReceiptIds));

      for (const wr of existingWrs) {
        if (wr.status === 'Consolidated' || (wr.assignedHouseBillId && wr.assignedHouseBillId.trim() !== '')) {
          throw new BadRequestError(`Warehouse receipt ${wr.receiptNumber} is already assigned to a House Bill or is Consolidated.`);
        }
      }
    }

    const totalCount = await this.repo.countTotal();
    const seq = String(totalCount + 1).padStart(4, '0');
    const hblNumber = input.hblNumber?.trim() || `HBL-2026-${seq}`;
    const createdDate = input.createdDate || new Date().toISOString().split('T')[0];
    const issueDate = input.issueDate || createdDate;

    let resolvedCustomerId: string | undefined = undefined;
    if (input.customerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.customerId)) {
      resolvedCustomerId = input.customerId;
    } else {
      const match = await db
        .select({ id: customers.id })
        .from(customers)
        .where(
          or(
            input.customerId ? eq(customers.customerNumber, input.customerId) : undefined,
            eq(customers.name, input.customerName)
          )
        )
        .limit(1);
      if (match.length > 0) resolvedCustomerId = match[0].id;
    }

    let notes = input.notes || '';
    const chargesPayload = (input as any).freightCharges || (input as any).charges;
    if (chargesPayload) {
      notes = `${notes}\n---FREIGHT_CHARGES---\n${JSON.stringify(chargesPayload)}`;
    }

    const created = await this.repo.create({
      hblNumber,
      customerId: resolvedCustomerId,
      customerName: input.customerName,

      shipper: typeof input.shipper === 'string' ? { name: input.shipper, address: 'Miami, FL' } : input.shipper,
      consignee: typeof input.consignee === 'string' ? { name: input.consignee, address: input.destinationPort || 'Destination Port' } : input.consignee,
      notifyParty: typeof input.notifyParty === 'string' ? { name: input.notifyParty, address: 'Destination Port' } : input.notifyParty,
      agentId: input.agentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.agentId) ? input.agentId : undefined,
      agentName: input.agentName,
      originPort: input.originPort || 'Port of Miami (USMIA), FL',
      destinationPort: input.destinationPort,
      destinationCode: input.destinationCode,
      warehouseReceiptIds: input.warehouseReceiptIds || [],
      cargoDescription: input.cargoDescription,
      packages: input.packages || [],
      totalPackages: input.totalPackages ?? 0,
      totalPieces: input.totalPieces ?? 0,
      totalWeightLbs: input.totalWeightLbs ? String(input.totalWeightLbs) : '0.00',
      totalWeightKg: input.totalWeightKg ? String(input.totalWeightKg) : '0.00',
      totalCft: input.totalCft ? String(input.totalCft) : '0.00',
      totalCbm: input.totalCbm ? String(input.totalCbm) : '0.00',
      status: input.status || 'Active',
      freightTerms: input.freightTerms || 'Freight Prepaid',
      createdDate,
      issueDate,
      assignedConsolidationId: input.assignedConsolidationId,
      assignedMasterBLId: input.assignedMasterBLId,
      assignedShipmentId: input.assignedShipmentId,
      notes,
    });

    // Automatically link downstream warehouse receipts in database
    if (input.warehouseReceiptIds && input.warehouseReceiptIds.length > 0) {
      try {
        const wrConditions = [];
        const uuidIds = input.warehouseReceiptIds.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
        if (uuidIds.length > 0) {
          wrConditions.push(inArray(warehouseReceipts.id, uuidIds));
        }
        wrConditions.push(inArray(warehouseReceipts.receiptNumber, input.warehouseReceiptIds));

        await db
          .update(warehouseReceipts)
          .set({ assignedHouseBillId: created.hblNumber, updatedAt: new Date() })
          .where(or(...wrConditions));
      } catch (wrErr) {
        console.warn('Notice updating warehouse receipts link on HBL creation:', wrErr);
      }
    }

    return hydrateHbl(created);
  }

  async updateHouseBill(idOrHblNumber: string, input: any) {
    const existing = await this.getHouseBill(idOrHblNumber);

    // Sanitize update fields to match database schema columns precisely
    const updateData: Record<string, any> = {};
    if (input.customerName !== undefined) updateData.customerName = input.customerName;
    if (input.cargoDescription !== undefined) updateData.cargoDescription = input.cargoDescription;
    if (input.shipper !== undefined) {
      updateData.shipper = typeof input.shipper === 'string' ? { name: input.shipper, address: 'Miami, FL' } : input.shipper;
    }
    if (input.consignee !== undefined) {
      updateData.consignee = typeof input.consignee === 'string' ? { name: input.consignee, address: 'Destination Port' } : input.consignee;
    }
    if (input.notifyParty !== undefined) {
      updateData.notifyParty = typeof input.notifyParty === 'string' ? { name: input.notifyParty, address: 'Destination Port' } : input.notifyParty;
    }
    if (input.originPort !== undefined) updateData.originPort = input.originPort;
    if (input.destinationPort !== undefined) updateData.destinationPort = input.destinationPort;
    if (input.destinationCode !== undefined) updateData.destinationCode = input.destinationCode;
    if (input.freightTerms !== undefined) updateData.freightTerms = input.freightTerms;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.assignedConsolidationId !== undefined) updateData.assignedConsolidationId = input.assignedConsolidationId;
    if (input.assignedMasterBLId !== undefined) updateData.assignedMasterBLId = input.assignedMasterBLId;
    if (input.assignedShipmentId !== undefined) updateData.assignedShipmentId = input.assignedShipmentId;
    if (input.totalPackages !== undefined) updateData.totalPackages = Number(input.totalPackages);
    if (input.totalPieces !== undefined) updateData.totalPieces = Number(input.totalPieces);
    if (input.totalWeightLbs !== undefined) updateData.totalWeightLbs = String(input.totalWeightLbs);
    if (input.totalWeightKg !== undefined) updateData.totalWeightKg = String(input.totalWeightKg);
    if (input.totalCft !== undefined) updateData.totalCft = String(input.totalCft);
    if (input.totalCbm !== undefined) updateData.totalCbm = String(input.totalCbm);
    if (Array.isArray(input.packages)) updateData.packages = input.packages;
    if (Array.isArray(input.warehouseReceiptIds)) updateData.warehouseReceiptIds = input.warehouseReceiptIds;

    if (input.customerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.customerId)) {
      updateData.customerId = input.customerId;
    }

    if (input.freightCharges !== undefined || (input as any).charges !== undefined) {
      const rawNotes = input.notes !== undefined ? input.notes : (existing.notes || '');
      const baseNotes = rawNotes.split('\n---FREIGHT_CHARGES---\n')[0];
      const charges = input.freightCharges || (input as any).charges;
      updateData.notes = charges ? `${baseNotes}\n---FREIGHT_CHARGES---\n${JSON.stringify(charges)}` : baseNotes;
    }

    const updated = await this.repo.update(idOrHblNumber, updateData);

    // If warehouseReceiptIds updated, sync linked WRs
    if (Array.isArray(input.warehouseReceiptIds)) {
      try {
        const wrConditions = [];
        const uuidIds = input.warehouseReceiptIds.filter((id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
        if (uuidIds.length > 0) {
          wrConditions.push(inArray(warehouseReceipts.id, uuidIds));
        }
        wrConditions.push(inArray(warehouseReceipts.receiptNumber, input.warehouseReceiptIds));

        await db
          .update(warehouseReceipts)
          .set({ assignedHouseBillId: existing.hblNumber, updatedAt: new Date() })
          .where(or(...wrConditions));
      } catch (wrErr) {
        console.warn('Notice syncing warehouse receipts link on HBL update:', wrErr);
      }
    }

    return hydrateHbl(updated);
  }

  async deleteHouseBill(idOrHblNumber: string) {
    const existing = await this.getHouseBill(idOrHblNumber);
    if (existing) {
      try {
        // Unlink assignedHouseBillId from warehouse receipts in database
        await db
          .update(warehouseReceipts)
          .set({ assignedHouseBillId: null, updatedAt: new Date() })
          .where(
            or(
              eq(warehouseReceipts.assignedHouseBillId, existing.id),
              eq(warehouseReceipts.assignedHouseBillId, existing.hblNumber)
            )
          );
      } catch (wrErr) {
        console.warn('Notice unlinking warehouse receipts on HBL delete:', wrErr);
      }
    }
    return this.repo.delete(idOrHblNumber);
  }

  async placeHold(
    idOrHblNumber: string,
    params: {
      reason: string;
      placedBy: string;
      holdNotes?: string;
      holdCategory?: string;
    }
  ) {
    await this.getHouseBill(idOrHblNumber);
    return this.repo.update(idOrHblNumber, {
      status: 'On Hold',
      notes: params.holdNotes
        ? `HOLD: ${params.reason} - ${params.holdNotes}`
        : `HOLD: ${params.reason}`,
    });
  }

  async releaseHold(idOrHblNumber: string) {
    await this.getHouseBill(idOrHblNumber);
    return this.repo.update(idOrHblNumber, {
      status: 'Active',
    });
  }
}

export const houseBillsService = new HouseBillsService();

