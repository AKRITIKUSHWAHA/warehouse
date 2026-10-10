import { eq, or } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { warehouseReceipts, trackingEvents, TrackingCheckpoint, consolidations } from '../../db/schema/index.js';
import { ShipmentsRepository, shipmentsRepository } from './shipments.repository.js';
import { ShipmentFilterParams, CreateShipmentInput, UpdateShipmentInput } from './shipments.types.js';
import { NotFoundError } from '../../common/errors/not-found-error.js';
import { convertLbsToKg } from '../../common/utils/calculations.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class ShipmentsService {
  constructor(private readonly repo: ShipmentsRepository = shipmentsRepository) {}

  async listShipments(filters: ShipmentFilterParams) {
    return this.repo.findMany(filters);
  }

  async getShipment(idOrNumber: string) {
    const item = await this.repo.findByIdOrNumber(idOrNumber);
    if (!item) throw new NotFoundError('Shipment');
    return item;
  }

  async createShipment(input: CreateShipmentInput) {
    const totalCount = await this.repo.countTotal();
    const seq = String(totalCount + 1).padStart(4, '0');
    let shipmentNumber = input.shipmentNumber && input.shipmentNumber.trim()
      ? input.shipmentNumber.trim()
      : `SHP-2026-${seq}`;

    // Verify uniqueness
    const existing = await this.repo.findByIdOrNumber(shipmentNumber);
    if (existing) {
      shipmentNumber = `SHP-2026-${Math.floor(100 + Math.random() * 900)}`;
    }

    const trackingNumber = input.trackingNumber && input.trackingNumber.trim()
      ? input.trackingNumber.trim()
      : `TRK-VI-${Math.floor(100000 + Math.random() * 900000)}`;

    const createdDate = input.createdDate || new Date().toISOString().split('T')[0];
    const destinationPort = input.destinationPort || 'NAS - Nassau Container Port';
    const destination = input.destination || destinationPort;
    const origin = input.origin || 'Port of Miami (USMIA)';

    const validAgentId = input.agentId && UUID_REGEX.test(input.agentId) ? input.agentId : null;

    const totalWeightLbsNum = Number(input.totalWeightLbs) || 0;
    const totalWeightKgNum = input.totalWeightKg ? Number(input.totalWeightKg) : convertLbsToKg(totalWeightLbsNum);

    const checkpoints: TrackingCheckpoint[] = (input.trackingCheckpoints && input.trackingCheckpoints.length > 0)
      ? input.trackingCheckpoints
      : [
          {
            id: `CHK-${Date.now()}-1`,
            stage: 'Cargo Received',
            status: 'Completed',
            date: createdDate,
            time: '08:30 AM',
            location: origin,
            notes: 'Consolidated cargo received and verified at CFS origin facility.',
          },
          {
            id: `CHK-${Date.now()}-2`,
            stage: 'Consolidated',
            status: input.status === 'Consolidated' || input.status === 'Loaded & Sealed' || input.status === 'In Transit' || input.status?.includes('Deliver') ? 'Completed' : 'Active',
            date: createdDate,
            time: '11:00 AM',
            location: origin,
            notes: 'Pallets consolidated and manifested for container load.',
          },
          {
            id: `CHK-${Date.now()}-3`,
            stage: 'Loaded & Sealed',
            status: input.status === 'Loaded & Sealed' || input.status === 'In Transit' || input.status?.includes('Deliver') ? 'Completed' : 'Pending',
            date: input.etd || createdDate,
            time: '02:30 PM',
            location: origin,
            notes: `Container ${input.containerNumber || 'TBD'} loaded and sealed with bolt seal ${input.sealNumber || 'N/A'}.`,
          },
          {
            id: `CHK-${Date.now()}-4`,
            stage: 'In Transit',
            status: input.status === 'In Transit' ? 'Active' : input.status?.includes('Deliver') ? 'Completed' : 'Pending',
            date: input.etd || createdDate,
            time: '06:00 PM',
            location: `${input.vesselName || 'Ocean Vessel'} (Voyage ${input.voyageNumber || 'N/A'})`,
            notes: `Ocean freight vessel en route to ${destinationPort}.`,
          },
          {
            id: `CHK-${Date.now()}-5`,
            stage: 'Arrived at Port',
            status: input.status === 'Arrived at Port' ? 'Active' : input.status?.includes('Deliver') ? 'Completed' : 'Pending',
            date: input.eta || createdDate,
            time: '09:00 AM',
            location: destinationPort,
            notes: `Vessel docked at ${destinationPort}. Awaiting discharge and terminal handling.`,
          },
          {
            id: `CHK-${Date.now()}-6`,
            stage: 'Delivered / Released',
            status: input.status?.includes('Deliver') ? 'Completed' : 'Pending',
            date: input.eta || createdDate,
            time: '04:00 PM',
            location: destinationPort,
            notes: 'Cargo cleared customs and released for final consignee release/delivery.',
          },
        ];

    const created = await this.repo.create({
      shipmentNumber,
      type: input.type || 'Ocean LCL Consolidation',
      serviceMode: input.serviceMode || 'Port-to-Port',
      status: input.status || 'Cargo Received',
      trackingNumber,
      origin,
      destination,
      destinationPort,
      destinationCode: input.destinationCode || 'NAS',
      agentId: validAgentId,
      agentName: input.agentName || null,
      vesselName: input.vesselName || null,
      voyageNumber: input.voyageNumber || null,
      carrier: input.carrier || 'Tropical Shipping',
      containerNumber: input.containerNumber || null,
      containerType: input.containerType || "40' Standard Dry",
      sealNumber: input.sealNumber || null,
      billOfLadingId: input.billOfLadingId || null,
      billOfLadingNumber: input.billOfLadingNumber || null,
      blStatus: input.blStatus || 'Draft',
      manifestNumber: input.manifestNumber || null,
      totalPackages: Number(input.totalPackages) || 0,
      totalWeightLbs: String(totalWeightLbsNum.toFixed(2)),
      totalWeightKg: String(totalWeightKgNum.toFixed(2)),
      totalCft: String((Number(input.totalCft) || 0).toFixed(2)),
      totalCbm: String((Number(input.totalCbm) || 0).toFixed(2)),
      etd: input.etd || createdDate,
      eta: input.eta || null,
      createdDate,
      warehouseReceiptIds: input.warehouseReceiptIds || [],
      consolidationId: input.consolidationId || null,
      currentLocation: input.currentLocation || origin,
      trackingCheckpoints: checkpoints,
    });

    // Link warehouse receipts in database if provided
    if (created && input.warehouseReceiptIds && input.warehouseReceiptIds.length > 0) {
      for (const wrId of input.warehouseReceiptIds) {
        const isWrUuid = UUID_REGEX.test(wrId);
        const cond = isWrUuid
          ? or(eq(warehouseReceipts.id, wrId), eq(warehouseReceipts.receiptNumber, wrId))
          : eq(warehouseReceipts.receiptNumber, wrId);

        await db
          .update(warehouseReceipts)
          .set({ assignedShipmentId: created.id, status: 'In Transit', updatedAt: new Date() })
          .where(cond)
          .catch(() => {});
      }
    }

    // Insert tracking events
    if (created) {
      for (let i = 0; i < checkpoints.length; i++) {
        const chk = checkpoints[i];
        await db.insert(trackingEvents).values({
          trackingNumber: created.trackingNumber,
          shipmentId: created.id,
          stage: chk.stage,
          status: chk.status || 'Pending',
          eventDate: chk.date || createdDate,
          eventTime: chk.time || '08:00 AM',
          location: chk.location || origin,
          notes: chk.notes || `Milestone: ${chk.stage}`,
          checkpointIndex: i,
        }).catch(() => {});
      }
    }

    return created;
  }

  async updateShipment(id: string, input: UpdateShipmentInput) {
    const existing = await this.getShipment(id);

    const updatePayload: Record<string, unknown> = { ...input };
    if (input.agentId !== undefined) {
      updatePayload.agentId = input.agentId && UUID_REGEX.test(input.agentId) ? input.agentId : null;
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

    // Sync tracking checkpoints if status changed
    if (input.trackingCheckpoints && Array.isArray(input.trackingCheckpoints)) {
      updatePayload.trackingCheckpoints = input.trackingCheckpoints;
    } else if (input.status) {
      const chks = ((existing.trackingCheckpoints as TrackingCheckpoint[]) || []).map(chk => {
        if (chk.stage.toLowerCase() === input.status!.toLowerCase()) {
          return { ...chk, status: 'Completed' as const, date: new Date().toISOString().split('T')[0] };
        }
        return chk;
      });
      updatePayload.trackingCheckpoints = chks;

      // Update matching tracking event in database
      await db
        .update(trackingEvents)
        .set({ status: 'Completed', eventDate: new Date().toISOString().split('T')[0], updatedAt: new Date() })
        .where(
          or(
            eq(trackingEvents.shipmentId, existing.id),
            eq(trackingEvents.trackingNumber, existing.trackingNumber)
          )
        )
        .catch(() => {});

      // Sync linked consolidation status
      if (existing.consolidationId) {
        const isCnsUuid = UUID_REGEX.test(existing.consolidationId);
        const cnsCond = isCnsUuid
          ? or(eq(consolidations.id, existing.consolidationId), eq(consolidations.consolidationNumber, existing.consolidationId))
          : eq(consolidations.consolidationNumber, existing.consolidationId);

        await db
          .update(consolidations)
          .set({ status: input.status, updatedAt: new Date() })
          .where(cnsCond)
          .catch(() => {});
      }
    }

    // Link any newly assigned warehouse receipts
    if (input.warehouseReceiptIds && input.warehouseReceiptIds.length > 0) {
      for (const wrId of input.warehouseReceiptIds) {
        const isWrUuid = UUID_REGEX.test(wrId);
        const cond = isWrUuid
          ? or(eq(warehouseReceipts.id, wrId), eq(warehouseReceipts.receiptNumber, wrId))
          : eq(warehouseReceipts.receiptNumber, wrId);

        await db
          .update(warehouseReceipts)
          .set({ assignedShipmentId: existing.id, updatedAt: new Date() })
          .where(cond)
          .catch(() => {});
      }
    }

    return this.repo.update(id, updatePayload);
  }

  async deleteShipment(id: string) {
    const existing = await this.getShipment(id);

    // Unassign linked warehouse receipts
    if (existing) {
      await db
        .update(warehouseReceipts)
        .set({ assignedShipmentId: null, updatedAt: new Date() })
        .where(
          or(
            eq(warehouseReceipts.assignedShipmentId, existing.id),
            eq(warehouseReceipts.assignedShipmentId, existing.shipmentNumber)
          )
        )
        .catch(() => {});

      // Clear tracking events
      await db
        .delete(trackingEvents)
        .where(
          or(
            eq(trackingEvents.shipmentId, existing.id),
            eq(trackingEvents.trackingNumber, existing.trackingNumber)
          )
        )
        .catch(() => {});
    }

    return this.repo.delete(id);
  }
}

export const shipmentsService = new ShipmentsService();

