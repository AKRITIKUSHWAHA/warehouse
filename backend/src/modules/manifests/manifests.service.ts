import { eq, or, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { billsOfLading, houseBills } from '../../db/schema/index.js';
import { ManifestsRepository, manifestsRepository } from './manifests.repository.js';
import { ManifestFilterParams, CreateManifestInput, UpdateManifestInput } from './manifests.types.js';
import { NotFoundError } from '../../common/errors/not-found-error.js';
import { convertLbsToKg } from '../../common/utils/calculations.js';

export class ManifestsService {
  constructor(private readonly repo: ManifestsRepository = manifestsRepository) {}

  private async enrichManifestWithLineItems(manifest: any) {
    if (!manifest) return manifest;
    if (manifest.lineItems && Array.isArray(manifest.lineItems) && manifest.lineItems.length > 0) {
      return manifest;
    }

    const blIdentifier = manifest.masterBLNumber || manifest.masterBLId;
    if (!blIdentifier) {
      return manifest;
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(blIdentifier);
    const blCondition = isUuid
      ? or(eq(billsOfLading.id, blIdentifier), eq(billsOfLading.blNumber, blIdentifier))
      : eq(billsOfLading.blNumber, blIdentifier);

    const [matchedBL] = await db
      .select()
      .from(billsOfLading)
      .where(blCondition)
      .limit(1);

    if (!matchedBL) {
      return manifest;
    }

    // Find linked house bills
    const hblConditions = [
      eq(houseBills.assignedMasterBLId, matchedBL.id),
      eq(houseBills.assignedMasterBLId, matchedBL.blNumber),
    ];
    if (matchedBL.houseBillIds && Array.isArray(matchedBL.houseBillIds) && matchedBL.houseBillIds.length > 0) {
      hblConditions.push(inArray(houseBills.hblNumber, matchedBL.houseBillIds));
    }

    const linkedHBLs = await db
      .select()
      .from(houseBills)
      .where(or(...hblConditions));

    let lineItems = [];
    if (linkedHBLs.length > 0) {
      lineItems = linkedHBLs.map((hbl, idx) => {
        const shipperName = typeof hbl.shipper === 'object' && hbl.shipper ? (hbl.shipper as any).name : String(hbl.shipper || 'Miami CFS Hub');
        const consigneeName = typeof hbl.consignee === 'object' && hbl.consignee ? (hbl.consignee as any).name : String(hbl.consignee || 'Consignee');
        const notifyPartyName = typeof hbl.notifyParty === 'object' && hbl.notifyParty ? (hbl.notifyParty as any).name : String(hbl.notifyParty || matchedBL.agentName || 'Port Destination Agent');
        
        const weightLbs = Number(hbl.totalWeightLbs) || 0;
        const weightKg = Number(hbl.totalWeightKg) || Number((weightLbs * 0.453592).toFixed(2));
        const cbm = Number(hbl.totalCbm) || 0;
        const cft = Number(hbl.totalCft) || Number((cbm * 35.3147).toFixed(2));

        return {
          itemNumber: idx + 1,
          hblNumber: hbl.hblNumber,
          blNumber: matchedBL.blNumber,
          shipper: shipperName,
          consignee: consigneeName,
          notifyParty: notifyPartyName,
          destinationPort: hbl.destinationPort || manifest.portOfDischarge,
          containerNumber: matchedBL.containerNumber || 'MSKU-829104-5',
          sealNumber: matchedBL.sealNumber || 'SEAL-VI-8821',
          packageCount: Number(hbl.totalPackages) || Number(hbl.totalPieces) || 1,
          totalPieces: Number(hbl.totalPieces) || Number(hbl.totalPackages) || 1,
          packageType: 'Cartons / Pallets',
          cargoDescription: hbl.cargoDescription || 'Consolidated Cargo Goods',
          grossWeightKg: weightKg,
          grossWeightLbs: weightLbs,
          cbm,
          cft,
          customsValueUsd: Number(((Number(hbl.totalPieces) || 1) * 1250).toFixed(2)) || 25000.00
        };
      });
    } else {
      const shipperName = typeof matchedBL.shipper === 'object' && matchedBL.shipper ? (matchedBL.shipper as any).name : String(matchedBL.shipper || 'Miami CFS Hub');
      const consigneeName = typeof matchedBL.consignee === 'object' && matchedBL.consignee ? (matchedBL.consignee as any).name : String(matchedBL.consignee || 'Consignee');
      const notifyPartyName = typeof matchedBL.notifyParty === 'object' && matchedBL.notifyParty ? (matchedBL.notifyParty as any).name : String(matchedBL.notifyParty || matchedBL.agentName || 'Port Destination Agent');

      const weightLbs = Number(matchedBL.grossWeightLbs) || 0;
      const weightKg = Number(matchedBL.grossWeightKg) || Number((weightLbs * 0.453592).toFixed(2));
      const cbm = Number(matchedBL.cbm) || 0;
      const cft = Number(matchedBL.cft) || Number((cbm * 35.3147).toFixed(2));

      lineItems = [
        {
          itemNumber: 1,
          hblNumber: 'DIRECT',
          blNumber: matchedBL.blNumber,
          shipper: shipperName,
          consignee: consigneeName,
          notifyParty: notifyPartyName,
          destinationPort: matchedBL.portOfDischarge || manifest.portOfDischarge,
          containerNumber: matchedBL.containerNumber || 'MSKU-829104-5',
          sealNumber: matchedBL.sealNumber || 'SEAL-VI-8821',
          packageCount: Number(matchedBL.packageCount) || 1,
          totalPieces: Number(matchedBL.totalPieces) || Number(matchedBL.packageCount) || 1,
          packageType: matchedBL.packageType || 'Packages',
          cargoDescription: matchedBL.cargoDescription || 'Consolidated Sea Freight',
          grossWeightKg: weightKg,
          grossWeightLbs: weightLbs,
          cbm,
          cft,
          customsValueUsd: 25000.00
        }
      ];
    }

    return {
      ...manifest,
      lineItems
    };
  }

  async listManifests(filters: ManifestFilterParams) {
    const result = await this.repo.findMany(filters);
    const enrichedData = await Promise.all(
      result.data.map((item) => this.enrichManifestWithLineItems(item))
    );
    return { data: enrichedData, total: result.total };
  }

  async getManifest(idOrNumber: string) {
    const item = await this.repo.findByIdOrNumber(idOrNumber);
    if (!item) throw new NotFoundError('Shipping Manifest');
    return this.enrichManifestWithLineItems(item);
  }

  async createManifest(input: CreateManifestInput) {
    const totalCount = await this.repo.countTotal();
    const seq = String(totalCount + 1).padStart(4, '0');
    const manifestNumber = input.manifestNumber && input.manifestNumber.trim()
      ? input.manifestNumber.trim()
      : `MNF-2026-${seq}`;

    let lineItems = input.lineItems || [];
    let totalPackages = Number(input.totalPackages) || 0;
    let totalPieces = Number(input.totalPieces) || totalPackages || 0;
    let weightLbs = Number(input.totalWeightLbs) || 0;
    let totalCbm = Number(input.totalCbm) || 0;
    let totalCft = Number(input.totalCft) || 0;

    // Auto-resolve line items if empty and masterBL is specified
    if ((!lineItems || lineItems.length === 0) && (input.masterBLNumber || input.masterBLId)) {
      const enriched = await this.enrichManifestWithLineItems({
        masterBLNumber: input.masterBLNumber || input.masterBLId,
        portOfDischarge: input.portOfDischarge,
        lineItems: []
      });
      if (enriched.lineItems && enriched.lineItems.length > 0) {
        lineItems = enriched.lineItems;
        if (totalPackages === 0) {
          totalPackages = lineItems.reduce((acc: number, cur: any) => acc + (Number(cur.packageCount) || 1), 0);
        }
        if (totalPieces === 0) {
          totalPieces = lineItems.reduce((acc: number, cur: any) => acc + (Number(cur.totalPieces) || 1), 0);
        }
        if (weightLbs === 0) {
          weightLbs = lineItems.reduce((acc: number, cur: any) => acc + (Number(cur.grossWeightLbs) || 0), 0);
        }
        if (totalCbm === 0) {
          totalCbm = lineItems.reduce((acc: number, cur: any) => acc + (Number(cur.cbm) || 0), 0);
        }
        if (totalCft === 0) {
          totalCft = lineItems.reduce((acc: number, cur: any) => acc + (Number(cur.cft) || 0), 0);
        }
      }
    }

    const weightKg = input.totalWeightKg ? Number(input.totalWeightKg) : convertLbsToKg(weightLbs);

    return this.repo.create({
      manifestNumber,
      type: input.type || 'Ocean Cargo Inward / Outward Manifest',
      title: input.title || `Ocean Cargo Manifest — ${input.vesselName || 'Vessel'}`,
      vesselName: input.vesselName || '',
      flag: input.flag || '',
      masterName: input.masterName || '',
      portOfLoading: input.portOfLoading || 'Port of Miami, USA (USMIA)',
      portOfDischarge: input.portOfDischarge || '',
      departureDate: input.departureDate || new Date().toISOString().split('T')[0],
      arrivalDate: input.arrivalDate || null,
      carrier: input.carrier || '',
      totalBLs: Number(input.totalBLs) || (lineItems.length > 0 ? lineItems.length : 1),
      totalHouseBills: Number(input.totalHouseBills) || (lineItems.length > 0 ? lineItems.length : 0),
      totalContainers: Number(input.totalContainers) || 1,
      totalPackages,
      totalPieces,
      totalWeightLbs: String(weightLbs.toFixed(2)),
      totalWeightKg: String(weightKg.toFixed(2)),
      totalCbm: String((Number(totalCbm) || 0).toFixed(2)),
      totalCft: String((Number(totalCft) || 0).toFixed(2)),
      status: input.status || 'Generated',
      masterBLNumber: input.masterBLNumber || input.masterBLId || null,
      lineItems,
    });
  }

  async updateManifest(id: string, input: UpdateManifestInput) {
    const existing = await this.getManifest(id);

    const updatePayload: Record<string, unknown> = { ...input };
    delete updatePayload.id;
    delete updatePayload.createdAt;
    delete updatePayload.updatedAt;

    if (input.totalWeightLbs !== undefined && input.totalWeightLbs !== null) {
      updatePayload.totalWeightLbs = String((Number(input.totalWeightLbs) || 0).toFixed(2));
    }
    if (input.totalWeightKg !== undefined && input.totalWeightKg !== null) {
      updatePayload.totalWeightKg = String((Number(input.totalWeightKg) || 0).toFixed(2));
    }
    if (input.totalCbm !== undefined && input.totalCbm !== null) {
      updatePayload.totalCbm = String((Number(input.totalCbm) || 0).toFixed(2));
    }
    if (input.totalCft !== undefined && input.totalCft !== null) {
      updatePayload.totalCft = String((Number(input.totalCft) || 0).toFixed(2));
    }

    return this.repo.update(existing.id, updatePayload);
  }

  async createFromMasterBL(blIdOrNumber: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(blIdOrNumber);
    const blCondition = isUuid
      ? or(eq(billsOfLading.id, blIdOrNumber), eq(billsOfLading.blNumber, blIdOrNumber))
      : eq(billsOfLading.blNumber, blIdOrNumber);

    const [matchedBL] = await db
      .select()
      .from(billsOfLading)
      .where(blCondition)
      .limit(1);

    if (!matchedBL) {
      throw new NotFoundError('Master Bill of Lading');
    }

    const isOnHold = matchedBL.status === 'On Hold' || (matchedBL.holdDetails as any)?.isOnHold;
    const status = isOnHold ? 'Generated (Subject to B/L Hold)' : 'Generated';

    return this.createManifest({
      type: 'Ocean Cargo Inward / Outward Manifest',
      masterBLNumber: matchedBL.blNumber,
      masterBLId: matchedBL.id,
      title: `Ocean Cargo Manifest - ${matchedBL.portOfDischarge} (${matchedBL.oceanVessel || 'Ocean Vessel'})`,
      vesselName: matchedBL.oceanVessel || 'M/V Regional Carrier',
      flag: '',
      carrier: matchedBL.carrier || 'Tropical Shipping Line',
      portOfLoading: matchedBL.portOfLoading,
      portOfDischarge: matchedBL.portOfDischarge,
      departureDate: matchedBL.issueDate || matchedBL.createdDate || new Date().toISOString().split('T')[0],
      totalBLs: 1,
      totalHouseBills: Array.isArray(matchedBL.houseBillIds) ? matchedBL.houseBillIds.length : 0,
      totalContainers: 1,
      totalPackages: matchedBL.packageCount || 0,
      totalPieces: matchedBL.totalPieces || matchedBL.packageCount || 0,
      totalWeightLbs: matchedBL.grossWeightLbs ? Number(matchedBL.grossWeightLbs) : 0,
      totalWeightKg: matchedBL.grossWeightKg ? Number(matchedBL.grossWeightKg) : 0,
      totalCbm: matchedBL.cbm ? Number(matchedBL.cbm) : 0,
      totalCft: matchedBL.cft ? Number(matchedBL.cft) : 0,
      status,
      lineItems: [],
    });
  }

  async deleteManifest(id: string) {
    const existing = await this.getManifest(id);
    return this.repo.delete(existing.id);
  }
}

export const manifestsService = new ManifestsService();
