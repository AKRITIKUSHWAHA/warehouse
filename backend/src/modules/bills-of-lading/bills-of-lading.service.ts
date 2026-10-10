import { BillsOfLadingRepository, billsOfLadingRepository } from './bills-of-lading.repository.js';
import { BillOfLadingFilterParams, CreateBillOfLadingInput, UpdateBillOfLadingInput } from './bills-of-lading.types.js';
import { NotFoundError } from '../../common/errors/not-found-error.js';
import { BadRequestError } from '../../common/errors/bad-request-error.js';
import { BL_STATUSES } from '../../common/constants/statuses.js';
import { convertLbsToKg } from '../../common/utils/calculations.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class BillsOfLadingService {
  constructor(private readonly repo: BillsOfLadingRepository = billsOfLadingRepository) {}

  async listBills(filters: BillOfLadingFilterParams) {
    return this.repo.findMany(filters);
  }

  async getBill(idOrNumber: string) {
    const item = await this.repo.findByIdOrNumber(idOrNumber);
    if (!item) throw new NotFoundError('Bill of Lading');
    return item;
  }

  async createBill(input: CreateBillOfLadingInput) {
    let blNumber = input.blNumber && input.blNumber.trim() ? input.blNumber.trim() : null;
    if (!blNumber) {
      blNumber = await this.repo.getNextBlNumber();
    } else {
      const existing = await this.repo.findByIdOrNumber(blNumber);
      if (existing) {
        blNumber = await this.repo.getNextBlNumber();
      }
    }

    const createdDate = input.createdDate || new Date().toISOString().split('T')[0];
    const issueDate = input.issueDate || createdDate;

    const validAgentId = input.agentId && UUID_REGEX.test(input.agentId) ? input.agentId : null;
    const validConsolId = input.consolidationId && UUID_REGEX.test(input.consolidationId) ? input.consolidationId : null;

    const shipperObj = typeof input.shipper === 'object' && input.shipper !== null
      ? input.shipper
      : { name: String(input.shipper || 'KERS Global Freight Forwarding Inc.'), address: '8200 NW 33rd Street, Miami, FL 33122 USA' };

    const consigneeObj = typeof input.consignee === 'object' && input.consignee !== null
      ? input.consignee
      : { name: String(input.consignee || 'General Consignee'), address: '' };

    const notifyObj = typeof input.notifyParty === 'object' && input.notifyParty !== null
      ? input.notifyParty
      : { name: 'Same as Consignee', address: '' };

    const weightLbs = Number(input.grossWeightLbs) || 0;
    const weightKg = input.grossWeightKg ? Number(input.grossWeightKg) : convertLbsToKg(weightLbs);
    const cbm = Number(input.cbm) || 0;
    const cft = input.cft ? Number(input.cft) : Number((cbm * 35.3147).toFixed(2));

    return this.repo.create({
      blNumber,
      type: input.type || 'Master Ocean Bill of Lading',
      status: input.status || 'Draft',
      shipmentId: input.shipmentId || null,
      shipmentNumber: input.shipmentNumber || null,
      consolidationId: validConsolId,
      houseBillIds: input.houseBillIds || [],
      createdDate,
      issueDate,
      shipper: shipperObj,
      consignee: consigneeObj,
      notifyParty: notifyObj,
      agentId: validAgentId,
      agentName: input.agentName || null,
      preCarriageBy: input.preCarriageBy || null,
      placeOfReceipt: input.placeOfReceipt || null,
      oceanVessel: input.oceanVessel || 'M/V Caribbean Voyager',
      voyageNumber: input.voyageNumber || 'VOY-2026-088',
      carrier: input.carrier || 'Tropical Shipping',
      portOfLoading: input.portOfLoading || 'Port of Miami, USA (USMIA)',
      portOfDischarge: input.portOfDischarge || 'Nassau Port Terminal (BSNAS)',
      placeOfDelivery: input.placeOfDelivery || null,
      containerNumber: input.containerNumber || null,
      sealNumber: input.sealNumber || null,
      containerType: input.containerType || "40' High Cube",
      marksAndNumbers: input.marksAndNumbers || null,
      cargoDescription: input.cargoDescription || 'General Cargo',
      packageCount: Number(input.packageCount) || 0,
      totalPieces: Number(input.totalPieces) || Number(input.packageCount) || 0,
      packageType: input.packageType || 'Packages',
      grossWeightLbs: String(weightLbs.toFixed(2)),
      grossWeightKg: String(weightKg.toFixed(2)),
      cbm: String(cbm.toFixed(2)),
      cft: String(cft.toFixed(2)),
      freightPayableAt: input.freightPayableAt || 'Miami, FL',
      freightTerms: input.freightTerms || 'Freight Prepaid',
      numberOfOriginals: input.numberOfOriginals || '3 (THREE)',
      holdDetails: input.holdDetails || { isOnHold: false },
      charges: input.charges || [],
      totalFreightUsd: String((Number(input.totalFreightUsd) || 0).toFixed(2)),
    });
  }

  async updateBill(idOrNumber: string, input: UpdateBillOfLadingInput) {
    const existing = await this.getBill(idOrNumber);

    const updatePayload: Record<string, unknown> = { ...input };
    delete updatePayload.id;
    delete updatePayload.linkedHouseBills;
    delete updatePayload.linkedShipment;
    delete updatePayload.linkedWarehouseReceipts;
    delete updatePayload.destinationPortCode;

    if ((input as any).shipperName) {
      updatePayload.shipper = {
        name: (input as any).shipperName,
        address: (input as any).shipperAddress || (existing.shipper as any)?.address || '',
      };
      delete (updatePayload as any).shipperName;
      delete (updatePayload as any).shipperAddress;
    }
    if ((input as any).consigneeName) {
      updatePayload.consignee = {
        name: (input as any).consigneeName,
        address: (input as any).consigneeAddress || (existing.consignee as any)?.address || '',
      };
      delete (updatePayload as any).consigneeName;
      delete (updatePayload as any).consigneeAddress;
    }
    if ((input as any).notifyPartyName) {
      updatePayload.notifyParty = {
        name: (input as any).notifyPartyName,
        address: (input as any).notifyPartyAddress || (existing.notifyParty as any)?.address || '',
      };
      delete (updatePayload as any).notifyPartyName;
      delete (updatePayload as any).notifyPartyAddress;
    }

    if (input.agentId !== undefined) {
      updatePayload.agentId = input.agentId && UUID_REGEX.test(input.agentId) ? input.agentId : null;
    }
    if (input.consolidationId !== undefined) {
      updatePayload.consolidationId = input.consolidationId && UUID_REGEX.test(input.consolidationId) ? input.consolidationId : null;
    }
    if (input.grossWeightLbs !== undefined) {
      updatePayload.grossWeightLbs = String((Number(input.grossWeightLbs) || 0).toFixed(2));
    }
    if (input.grossWeightKg !== undefined) {
      updatePayload.grossWeightKg = String((Number(input.grossWeightKg) || 0).toFixed(2));
    }
    if (input.cbm !== undefined) {
      updatePayload.cbm = String((Number(input.cbm) || 0).toFixed(2));
    }
    if (input.cft !== undefined) {
      updatePayload.cft = String((Number(input.cft) || 0).toFixed(2));
    }
    if (input.totalFreightUsd !== undefined) {
      updatePayload.totalFreightUsd = String((Number(input.totalFreightUsd) || 0).toFixed(2));
    }

    return this.repo.update(existing.id, updatePayload);
  }

  async deleteBill(idOrNumber: string) {
    const existing = await this.getBill(idOrNumber);
    return this.repo.delete(existing.id);
  }

  async placeHold(
    id: string,
    params: {
      reason: string;
      placedBy: string;
      holdCategory?: string;
      holdNotes?: string;
      contactEmail?: string;
      contactPhone?: string;
    }
  ) {
    const existing = await this.getBill(id);
    if (existing.status === BL_STATUSES.ON_HOLD) {
      throw new BadRequestError('Bill of Lading is already on hold.');
    }
    if (existing.status === BL_STATUSES.RELEASED) {
      throw new BadRequestError('Cannot place hold on an already released Bill of Lading.');
    }
    if (existing.status === BL_STATUSES.CANCELLED || existing.status === 'Cancelled') {
      throw new BadRequestError('Cannot place hold on a cancelled Bill of Lading.');
    }

    const holdDetails = {
      isOnHold: true,
      reason: params.reason,
      placedBy: params.placedBy,
      placedAt: new Date().toISOString(),
      holdCategory: params.holdCategory || 'Financial Clearance',
      holdNotes: params.holdNotes,
      contactEmail: params.contactEmail,
      contactPhone: params.contactPhone,
    };

    return this.repo.updateHoldStatus(id, BL_STATUSES.ON_HOLD, holdDetails);
  }

  async clearHold(id: string, releasedBy: string, notes?: string, authRef?: string) {
    const existing = await this.getBill(id);
    if (existing.status !== BL_STATUSES.ON_HOLD) {
      throw new BadRequestError('Bill of Lading is not on hold.');
    }

    const holdDetails = {
      isOnHold: false,
      reason: null,
      releasedBy,
      releasedAt: new Date().toISOString(),
      clearanceNotes: notes || null,
      authRef: authRef || null,
    };

    return this.repo.updateHoldStatus(id, BL_STATUSES.RELEASED, holdDetails);
  }
}

export const billsOfLadingService = new BillsOfLadingService();
