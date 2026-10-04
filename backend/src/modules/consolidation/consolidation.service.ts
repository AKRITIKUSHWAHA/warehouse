import { ConsolidationRepository, consolidationRepository } from './consolidation.repository.js';
import { ConsolidationFilterParams, CreateConsolidationInput, UpdateConsolidationInput } from './consolidation.types.js';
import { NotFoundError } from '../../common/errors/not-found-error.js';
import { BadRequestError } from '../../common/errors/bad-request-error.js';
import { convertLbsToKg } from '../../common/utils/calculations.js';
import { db } from '../../db/index.js';
import {
  consolidations,
  warehouseReceipts,
  houseBills,
  cargo,
  shipments,
  billsOfLading,
  manifests,
  trackingEvents,
  agents
} from '../../db/schema/index.js';
import { eq, or, inArray, count } from 'drizzle-orm';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const VALID_TRANSITIONS: Record<string, string[]> = {
  Planning: ['Loaded', 'Cancelled', 'Planning'],
  Loaded: ['Sealed', 'Planning', 'Cancelled', 'Loaded'],
  Sealed: ['In Transit', 'Loaded', 'Cancelled', 'Sealed'],
  'In Transit': ['Completed', 'Cancelled', 'In Transit'],
  Completed: ['Completed'],
  Cancelled: ['Planning'],
};

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
    return await db.transaction(async (tx) => {
      // 1. Eligibility Check: Check if selected WRs are already consolidated
      if (input.receiptIds && input.receiptIds.length > 0) {
        const wrs = await tx
          .select({
            id: warehouseReceipts.id,
            receiptNumber: warehouseReceipts.receiptNumber,
            assignedConsolidationId: warehouseReceipts.assignedConsolidationId
          })
          .from(warehouseReceipts)
          .where(inArray(warehouseReceipts.receiptNumber, input.receiptIds));

        for (const wr of wrs) {
          if (wr.assignedConsolidationId && wr.assignedConsolidationId.trim() !== '') {
            throw new BadRequestError(`Warehouse receipt ${wr.receiptNumber} is already part of consolidation ${wr.assignedConsolidationId}`);
          }
        }
      }

      // 2. Eligibility Check: Check if selected HBLs are already consolidated
      let selectedHbls: any[] = [];
      if (input.houseBillIds && input.houseBillIds.length > 0) {
        selectedHbls = await tx
          .select()
          .from(houseBills)
          .where(inArray(houseBills.hblNumber, input.houseBillIds));

        for (const hb of selectedHbls) {
          if (hb.assignedConsolidationId && hb.assignedConsolidationId.trim() !== '') {
            throw new BadRequestError(`House Bill ${hb.hblNumber} is already part of consolidation ${hb.assignedConsolidationId}`);
          }
        }
      }

      // 3. Sequential numbering
      const [{ cnsCount }] = await tx.select({ cnsCount: count() }).from(consolidations);
      const cnsSeq = String(Number(cnsCount) + 1).padStart(4, '0');
      const consolidationNumber = input.consolidationNumber?.trim() || `CNS-2026-${cnsSeq}`;

      const [{ shpCount }] = await tx.select({ shpCount: count() }).from(shipments);
      const shpSeq = String(Number(shpCount) + 1).padStart(4, '0');
      const shipmentNumber = input.assignedShipmentId?.trim() || `SHP-2026-${shpSeq}`;

      const [{ blCount }] = await tx.select({ blCount: count() }).from(billsOfLading);
      const blSeq = String(Number(blCount) + 1).padStart(4, '0');
      const blNumber = input.assignedMasterBLId?.trim() || `BL-VI-2026-${blSeq}`;

      const [{ mnfCount }] = await tx.select({ mnfCount: count() }).from(manifests);
      const mnfSeq = String(Number(mnfCount) + 1).padStart(4, '0');
      const manifestNumber = `MNF-2026-${mnfSeq}`;

      const trackingNumber = `TRK-VI-${Math.floor(100000 + Math.random() * 900000)}`;

      const createdDate = input.createdDate || new Date().toISOString().split('T')[0];
      const destinationPort = input.destinationPort || 'NAS - Nassau Container Port';
      const dischargePort = input.dischargePort || destinationPort;
      const loadingPort = input.loadingPort || 'Port of Miami (USMIA)';
      const title = input.title || `Consolidation - ${destinationPort} (${createdDate})`;

      const validContainerId = input.containerId && UUID_REGEX.test(input.containerId) ? input.containerId : null;
      const validVesselId = input.vesselId && UUID_REGEX.test(input.vesselId) ? input.vesselId : null;
      const validVoyageId = input.voyageId && UUID_REGEX.test(input.voyageId) ? input.voyageId : null;

      let validAgentId: string | null = null;
      if (input.agentId && UUID_REGEX.test(input.agentId)) {
        validAgentId = input.agentId;
      } else if (input.destinationCode) {
        const agentMatch = await tx
          .select({ id: agents.id, name: agents.name })
          .from(agents)
          .where(eq(agents.assignedPortCode, input.destinationCode))
          .limit(1);
        if (agentMatch.length > 0) {
          validAgentId = agentMatch[0].id;
        }
      }

      const weightLbs = Number(input.totalWeightLbs) || 0;
      const weightKg = input.totalWeightKg ? Number(input.totalWeightKg) : convertLbsToKg(weightLbs);

      // 4. Insert Consolidation record
      const [created] = await tx
        .insert(consolidations)
        .values({
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
          assignedShipmentId: shipmentNumber,
          assignedMasterBLId: blNumber,
          notes: input.notes || null,
        })
        .returning();

      // 5. Gather all associated WR numbers from direct inputs and HBLs
      const allWrNumbers = new Set<string>(input.receiptIds || []);
      for (const hb of selectedHbls) {
        if (Array.isArray(hb.warehouseReceiptIds)) {
          for (const rId of hb.warehouseReceiptIds) {
            allWrNumbers.add(String(rId));
          }
        }
      }
      const wrArray = Array.from(allWrNumbers);

      // 6. Update linked Warehouse Receipts & Cargo status
      if (wrArray.length > 0) {
        const uuidWrs = wrArray.filter((r) => UUID_REGEX.test(r));
        const wrConds = [];
        if (uuidWrs.length > 0) wrConds.push(inArray(warehouseReceipts.id, uuidWrs));
        wrConds.push(inArray(warehouseReceipts.receiptNumber, wrArray));

        await tx
          .update(warehouseReceipts)
          .set({
            assignedConsolidationId: created.consolidationNumber,
            status: 'Consolidated',
            updatedAt: new Date(),
          })
          .where(or(...wrConds));

        await tx
          .update(cargo)
          .set({
            status: 'Consolidated',
            updatedAt: new Date(),
          })
          .where(inArray(cargo.receiptNumber, wrArray));
      }

      // 7. Update linked House Bills
      if (input.houseBillIds && input.houseBillIds.length > 0) {
        const uuidHbs = input.houseBillIds.filter((id) => UUID_REGEX.test(id));
        const hbConds = [];
        if (uuidHbs.length > 0) hbConds.push(inArray(houseBills.id, uuidHbs));
        hbConds.push(inArray(houseBills.hblNumber, input.houseBillIds));

        await tx
          .update(houseBills)
          .set({
            assignedConsolidationId: created.consolidationNumber,
            assignedShipmentId: shipmentNumber,
            assignedMasterBLId: blNumber,
            status: 'Consolidated',
            updatedAt: new Date(),
          })
          .where(or(...hbConds));
      }

      // 8. Construct Manifest Line Items from linked House Bills
      const lineItems: any[] = [];
      if (selectedHbls.length > 0) {
        selectedHbls.forEach((hb, idx) => {
          lineItems.push({
            itemNumber: idx + 1,
            hblNumber: hb.hblNumber,
            blNumber: blNumber,
            shipper: typeof hb.shipper === 'object' && hb.shipper ? (hb.shipper as any).name : String(hb.shipper || ''),
            consignee: typeof hb.consignee === 'object' && hb.consignee ? (hb.consignee as any).name : String(hb.consignee || ''),
            notifyParty: typeof hb.notifyParty === 'object' && hb.notifyParty ? (hb.notifyParty as any).name : String(hb.notifyParty || ''),
            destinationPort: hb.destinationPort || destinationPort,
            containerNumber: input.containerNumber || 'TBD',
            sealNumber: input.sealNumber || 'TBD',
            packageCount: Number(hb.totalPackages) || 0,
            totalPieces: Number(hb.totalPieces) || 0,
            packageType: 'Packages',
            cargoDescription: hb.cargoDescription || 'Consolidated Cargo Goods',
            grossWeightKg: Number(hb.totalWeightKg) || 0,
            grossWeightLbs: Number(hb.totalWeightLbs) || 0,
            cbm: Number(hb.totalCbm) || 0,
            cft: Number(hb.totalCft) || 0,
          });
        });
      }

      // 9. Insert Master Shipment
      const [createdShipment] = await tx
        .insert(shipments)
        .values({
          shipmentNumber,
          type: 'Ocean LCL Consolidation',
          serviceMode: 'Port-to-Port',
          status: 'Consolidated',
          trackingNumber,
          origin: loadingPort,
          destination: dischargePort,
          destinationPort,
          destinationCode: input.destinationCode || 'NAS',
          agentId: validAgentId,
          agentName: input.agentName || null,
          vesselName: input.vesselName || null,
          voyageNumber: input.voyageNumber || null,
          carrier: input.carrier || 'Tropical Shipping Line',
          containerNumber: input.containerNumber || null,
          containerType: input.containerType || "40' Standard Dry",
          sealNumber: input.sealNumber || null,
          billOfLadingId: blNumber,
          billOfLadingNumber: blNumber,
          blStatus: 'Draft',
          manifestNumber,
          totalPackages: Number(input.totalPackages) || 0,
          totalWeightLbs: String(weightLbs.toFixed(2)),
          totalWeightKg: String(weightKg.toFixed(2)),
          totalCft: String((Number(input.totalCft) || 0).toFixed(2)),
          totalCbm: String((Number(input.totalCbm) || 0).toFixed(2)),
          etd: (input as any).etd || null,
          eta: (input as any).eta || null,
          createdDate,
          warehouseReceiptIds: wrArray,
          consolidationId: created.consolidationNumber,
          currentLocation: 'Miami CFS Warehouse',
          trackingCheckpoints: [
            { id: 'ev-1', stage: 'Cargo Received', status: 'Completed', date: createdDate, location: 'Miami CFS Warehouse', notes: 'Cargo received and staged' },
            { id: 'ev-2', stage: 'Consolidated', status: 'Completed', date: createdDate, location: 'Miami CFS Warehouse', notes: `Consolidated into ${created.consolidationNumber}` },
            { id: 'ev-3', stage: 'Loaded & Sealed', status: 'Pending', date: (input as any).etd || createdDate, location: 'Miami CFS Yard', notes: 'Awaiting container loading & seal' },
            { id: 'ev-4', stage: 'In Transit', status: 'Pending', date: (input as any).etd || createdDate, location: 'Port of Miami (USMIA)', notes: 'Vessel departure' },
            { id: 'ev-5', stage: 'Arrived at Port', status: 'Pending', date: (input as any).eta || createdDate, location: destinationPort, notes: 'Vessel arrival at discharge port' },
            { id: 'ev-6', stage: 'Delivered / Released', status: 'Pending', date: (input as any).eta || createdDate, location: destinationPort, notes: 'Customs cleared & released' },
          ],
        })
        .returning();

      // 10. Insert Master Bill of Lading
      await tx
        .insert(billsOfLading)
        .values({
          blNumber,
          type: 'Master Ocean Bill of Lading',
          status: 'Draft',
          shipmentId: createdShipment.id,
          shipmentNumber,
          consolidationId: created.id,
          houseBillIds: input.houseBillIds || [],
          createdDate,
          issueDate: createdDate,
          shipper: { name: 'VI Customs Brokers & Logistics', address: '1200 NW 78th Ave, Miami, FL 33126', contact: '+1 (305) 555-0199' },
          consignee: { name: input.agentName || 'To Order of Destination Agent', address: destinationPort, contact: '' },
          notifyParty: { name: input.agentName || 'Same as Consignee', address: destinationPort },
          agentId: validAgentId,
          agentName: input.agentName || null,
          preCarriageBy: 'Truck / Drayage',
          placeOfReceipt: 'Miami CFS Facility',
          oceanVessel: input.vesselName || null,
          voyageNumber: input.voyageNumber || null,
          carrier: input.carrier || 'Tropical Shipping Line',
          portOfLoading: loadingPort,
          portOfDischarge: dischargePort,
          placeOfDelivery: destinationPort,
          containerNumber: input.containerNumber || null,
          sealNumber: input.sealNumber || null,
          containerType: input.containerType || "40' Standard Dry",
          marksAndNumbers: `${input.containerNumber || 'TBD'} / SEAL: ${input.sealNumber || 'TBD'}`,
          cargoDescription: `Consolidation of ${input.totalHouseBills || (input.houseBillIds?.length || 0)} House Bills / ${input.totalPackages || 0} packages`,
          packageCount: Number(input.totalPackages) || 0,
          totalPieces: Number(input.totalPieces) || Number(input.totalPackages) || 0,
          packageType: 'Packages',
          grossWeightLbs: String(weightLbs.toFixed(2)),
          grossWeightKg: String(weightKg.toFixed(2)),
          cbm: String((Number(input.totalCbm) || 0).toFixed(2)),
          cft: String((Number(input.totalCft) || 0).toFixed(2)),
          charges: [],
        })
        .returning();

      // 11. Insert Manifest
      await tx
        .insert(manifests)
        .values({
          manifestNumber,
          type: 'Ocean Cargo Inward / Outward Manifest',
          title: `Ocean Cargo Manifest - ${destinationPort} (${input.vesselName || 'Ocean Vessel'} / ${input.voyageNumber || 'Voyage'})`,
          vesselName: input.vesselName || 'Ocean Carrier',
          voyageNumber: input.voyageNumber || 'V.001',
          flag: 'Bahamas',
          masterName: 'Capt. E. Smith',
          portOfLoading: loadingPort,
          portOfDischarge: dischargePort,
          departureDate: (input as any).etd || createdDate,
          arrivalDate: (input as any).eta || createdDate,
          carrier: input.carrier || 'Tropical Shipping Line',
          totalBLs: 1,
          totalHouseBills: Number(input.totalHouseBills) || (input.houseBillIds?.length || 0),
          totalContainers: 1,
          totalPackages: Number(input.totalPackages) || 0,
          totalPieces: Number(input.totalPieces) || Number(input.totalPackages) || 0,
          totalWeightLbs: String(weightLbs.toFixed(2)),
          totalWeightKg: String(weightKg.toFixed(2)),
          totalCbm: String((Number(input.totalCbm) || 0).toFixed(2)),
          totalCft: String((Number(input.totalCft) || 0).toFixed(2)),
          status: 'Generated',
          masterBLNumber: blNumber,
          lineItems,
        })
        .returning();

      // 12. Insert 6 Checkpoint Tracking Events
      await tx.insert(trackingEvents).values([
        {
          trackingNumber,
          shipmentId: createdShipment.id,
          stage: 'Cargo Received',
          status: 'Completed',
          eventDate: createdDate,
          eventTime: '08:30 AM',
          location: 'Miami CFS Warehouse',
          notes: 'Cargo received and inventoried at Miami CFS',
          checkpointIndex: 0,
        },
        {
          trackingNumber,
          shipmentId: createdShipment.id,
          stage: 'Consolidated',
          status: 'Completed',
          eventDate: createdDate,
          eventTime: '11:00 AM',
          location: 'Miami CFS Warehouse',
          notes: `Consolidated under master shipment ${shipmentNumber} / Box ${consolidationNumber}`,
          checkpointIndex: 1,
        },
        {
          trackingNumber,
          shipmentId: createdShipment.id,
          stage: 'Loaded & Sealed',
          status: 'Pending',
          eventDate: (input as any).etd || createdDate,
          eventTime: '02:00 PM',
          location: 'Miami CFS Yard',
          notes: `Stuffed into container ${input.containerNumber || 'TBD'}, seal ${input.sealNumber || 'TBD'}`,
          checkpointIndex: 2,
        },
        {
          trackingNumber,
          shipmentId: createdShipment.id,
          stage: 'In Transit',
          status: 'Pending',
          eventDate: (input as any).etd || createdDate,
          eventTime: '06:00 PM',
          location: 'Port of Miami (USMIA)',
          notes: `Vessel departed origin en route to ${destinationPort}`,
          checkpointIndex: 3,
        },
        {
          trackingNumber,
          shipmentId: createdShipment.id,
          stage: 'Arrived at Port',
          status: 'Pending',
          eventDate: (input as any).eta || createdDate,
          eventTime: '09:00 AM',
          location: destinationPort,
          notes: 'Vessel arrived at destination port of discharge',
          checkpointIndex: 4,
        },
        {
          trackingNumber,
          shipmentId: createdShipment.id,
          stage: 'Delivered / Released',
          status: 'Pending',
          eventDate: (input as any).eta || createdDate,
          eventTime: '04:00 PM',
          location: destinationPort,
          notes: 'Consignment cleared through customs and released to agent',
          checkpointIndex: 5,
        },
      ]);

      return created;
    });
  }

  async updateConsolidation(id: string, input: UpdateConsolidationInput) {
    const existing = await this.getConsolidation(id);

    // Enforce state machine transitions
    if (input.status && input.status !== existing.status) {
      const allowed = VALID_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(input.status)) {
        throw new BadRequestError(`Invalid status transition from ${existing.status} to ${input.status}`);
      }
    }

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
            updatedAt: new Date(),
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
            assignedShipmentId: null,
            assignedMasterBLId: null,
            status: 'Active',
            updatedAt: new Date(),
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
                updatedAt: new Date(),
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
