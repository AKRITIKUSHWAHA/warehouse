import { HistoryRepository, historyRepository } from './history.repository.js';
import {
  ShipmentHistoryFilterParams,
  EnrichedHistoryShipment,
  ShipmentHistoryMetrics,
  ShipmentFlowStage,
} from './history.types.js';
import { NotFoundError } from '../../common/errors/not-found-error.js';
import { convertLbsToKg } from '../../common/utils/calculations.js';

export class HistoryService {
  constructor(private readonly repo: HistoryRepository = historyRepository) {}

  /**
   * Helper to compute transit days between ETD and ETA
   */
  private calculateTransitDays(etd?: string | null, eta?: string | null): number {
    if (!etd || !eta) return 4; // default maritime ocean voyage duration in region
    try {
      const d1 = new Date(etd).getTime();
      const d2 = new Date(eta).getTime();
      if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
        return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
      }
    } catch {
      // fallback
    }
    return 4;
  }

  /**
   * Enriches raw shipment record with dynamic flow stages and cargo calculations
   */
  enrichShipment(s: any): EnrichedHistoryShipment {
    const totalWeightLbs = Number(s.totalWeightLbs) || 0;
    const totalWeightKg = Number(s.totalWeightKg) || convertLbsToKg(totalWeightLbs);
    const totalCbm = Number(s.totalCbm) || 0;
    const totalCft = Number(s.totalCft) || Number((totalCbm * 35.3147).toFixed(2));
    const totalPackages = Number(s.totalPackages) || 0;

    // Density Calculation: kg per CBM
    const densityKgPerCbm = totalCbm > 0 ? Number((totalWeightKg / totalCbm).toFixed(2)) : 0;

    // Ocean freight standard volumetric weight (1 CBM = 35.3147 CFT = ~771 lbs volumetric ratio)
    const volumetricWeightLbs = Number((totalCbm * 771.6).toFixed(2));
    const chargeableWeightLbs = Math.max(totalWeightLbs, volumetricWeightLbs);

    const estimatedTransitDays = this.calculateTransitDays(s.etd, s.eta);

    // Flow Progress & Stage Mapping
    const statusNormalized = (s.status || '').toLowerCase();
    let currentStageNumber = 1;
    let flowProgressPercent = 20;

    if (statusNormalized.includes('deliver') || statusNormalized.includes('released')) {
      currentStageNumber = 6;
      flowProgressPercent = 100;
    } else if (statusNormalized.includes('arrived') || statusNormalized.includes('port')) {
      currentStageNumber = 5;
      flowProgressPercent = 90;
    } else if (statusNormalized.includes('transit') || statusNormalized.includes('departed')) {
      currentStageNumber = 4;
      flowProgressPercent = 75;
    } else if (statusNormalized.includes('loaded') || statusNormalized.includes('sealed')) {
      currentStageNumber = 3;
      flowProgressPercent = 55;
    } else if (statusNormalized.includes('consolidat')) {
      currentStageNumber = 2;
      flowProgressPercent = 35;
    } else {
      currentStageNumber = 1;
      flowProgressPercent = 15;
    }

    // Build the 6-Stage Lifecycle Flow
    const getStageStatus = (stageIdx: number): 'completed' | 'current' | 'pending' => {
      if (currentStageNumber > stageIdx) return 'completed';
      if (currentStageNumber === stageIdx) return 'current';
      return 'pending';
    };

    const flowStages: ShipmentFlowStage[] = [
      {
        stageNumber: 1,
        key: 'intake',
        name: 'Warehouse Cargo Intake',
        subtitle: 'Receiving, Scale & Dimension Verification',
        status: getStageStatus(1),
        date: s.createdDate || s.createdAt?.toISOString().split('T')[0],
        location: s.origin || 'Miami CFS Warehouse',
        details: {
          packages: totalPackages,
          grossWeightLbs: totalWeightLbs,
          grossWeightKg: totalWeightKg,
          cubicVolumeCbm: totalCbm,
        },
        calculationNotes: `Total ${totalPackages} items scale-verified at ${totalWeightLbs.toLocaleString()} lbs (${totalCbm} CBM).`,
      },
      {
        stageNumber: 2,
        key: 'consolidation',
        name: 'LCL Cargo Consolidation',
        subtitle: 'House Bills Aggregation & Load Plan',
        status: getStageStatus(2),
        date: s.createdDate || 'Scheduled',
        location: s.origin || 'Consolidation Bay 4',
        details: {
          consolidationId: s.consolidationId || 'CNS-AUTO',
          billOfLading: s.billOfLadingNumber || 'MBL-PENDING',
          blStatus: s.blStatus || 'Issued',
        },
        calculationNotes: `Consolidation optimized to fill ${s.containerType || '40ft HC Container'} with density ${densityKgPerCbm} kg/CBM.`,
      },
      {
        stageNumber: 3,
        key: 'loading',
        name: 'Container Loading & Sealing',
        subtitle: 'Container Packing & High-Security Seal Applied',
        status: getStageStatus(3),
        date: s.createdDate || 'Verified',
        location: `${s.origin || 'Miami CFS'} Loading Dock`,
        details: {
          containerNumber: s.containerNumber || 'CONT-PENDING',
          sealNumber: s.sealNumber || 'SEAL-PENDING',
          containerType: s.containerType || '40ft Standard Dry',
        },
        calculationNotes: `Container ${s.containerNumber || 'Assigned'} secured with bolt seal #${s.sealNumber || 'N/A'}.`,
      },
      {
        stageNumber: 4,
        key: 'transit',
        name: 'Ocean Transit & Voyage',
        subtitle: 'Vessel Underway to Destination',
        status: getStageStatus(4),
        date: s.etd || 'Scheduled Departure',
        location: `At Sea — ${s.vesselName || 'Ocean Carrier'}`,
        details: {
          vessel: s.vesselName || 'M/V Tropical Express',
          voyage: s.voyageNumber || 'VOY-2026-01',
          carrier: s.carrier || 'Tropical Shipping',
          etd: s.etd,
          eta: s.eta,
          transitDays: `${estimatedTransitDays} Days`,
        },
        calculationNotes: `Voyage ${s.voyageNumber || 'active'} en route; estimated ocean sailing time: ${estimatedTransitDays} days.`,
      },
      {
        stageNumber: 5,
        key: 'arrival',
        name: 'Destination Port Arrival',
        subtitle: 'Berthing & Customs Inspection Clearance',
        status: getStageStatus(5),
        date: s.eta || 'Pending Arrival',
        location: s.destinationPort || s.destination,
        details: {
          port: s.destinationPort || 'NAS',
          agent: s.agentName || 'Destination Port Agent',
          manifest: s.manifestNumber || 'MNF-VI-2026',
        },
        calculationNotes: `Vessel discharging cargo at ${s.destinationCode || 'NAS'} terminal; Customs manifest validated.`,
      },
      {
        stageNumber: 6,
        key: 'delivery',
        name: 'Final Release & Delivery',
        subtitle: 'Consignee Handover & Historical Archival',
        status: getStageStatus(6),
        date: s.status === 'Delivered' ? (s.eta || 'Delivered') : 'Pending Final Release',
        location: s.destinationPort || s.destination,
        details: {
          released: s.status === 'Delivered' ? 'Yes' : 'Pending Clearance',
          consigneeHandover: s.status === 'Delivered' ? 'Completed' : 'Pending',
        },
        calculationNotes: s.status === 'Delivered'
          ? `Consignment handed over in good order; marked complete in historical archive.`
          : `Awaiting final destination handover and customs gate pass clearance.`,
      },
    ];

    return {
      id: s.id,
      shipmentNumber: s.shipmentNumber,
      trackingNumber: s.trackingNumber,
      type: s.type || 'Ocean LCL Consolidation',
      serviceMode: s.serviceMode || 'Port-to-Port',
      status: s.status || 'In Transit',
      flowProgressPercent,
      currentStageNumber,
      origin: s.origin || 'Miami, FL (USMIA)',
      destination: s.destination || s.destinationPort,
      destinationPort: s.destinationPort || 'NAS - Nassau Container Port',
      destinationCode: s.destinationCode || 'NAS',
      agentName: s.agentName,
      carrier: s.carrier,
      vesselName: s.vesselName,
      voyageNumber: s.voyageNumber,
      containerNumber: s.containerNumber,
      containerType: s.containerType,
      sealNumber: s.sealNumber,
      billOfLadingNumber: s.billOfLadingNumber,
      blStatus: s.blStatus || 'Released',
      manifestNumber: s.manifestNumber,
      etd: s.etd,
      eta: s.eta,
      createdDate: s.createdDate,
      
      // Dynamic Calculations
      totalPackages,
      totalWeightLbs,
      totalWeightKg,
      totalCbm,
      totalCft,
      densityKgPerCbm,
      chargeableWeightLbs,
      estimatedTransitDays,
      
      // Full Flow Lifecycle
      flowStages,
      checkpoints: s.trackingCheckpoints || [],
    };
  }

  /**
   * Computes aggregate metrics from all matching shipments
   */
  calculateMetrics(shipmentList: any[]): ShipmentHistoryMetrics {
    const totalShipments = shipmentList.length;
    let deliveredCount = 0;
    let inTransitCount = 0;
    let loadedSealedCount = 0;
    let cargoReceivedCount = 0;
    let totalPackages = 0;
    let totalWeightLbs = 0;
    let totalWeightKg = 0;
    let totalCbm = 0;
    let totalCft = 0;

    for (const s of shipmentList) {
      const st = (s.status || '').toLowerCase();
      if (st.includes('deliver') || st.includes('release')) {
        deliveredCount++;
      } else if (st.includes('transit') || st.includes('arrived')) {
        inTransitCount++;
      } else if (st.includes('loaded') || st.includes('seal') || st.includes('consolidat')) {
        loadedSealedCount++;
      } else {
        cargoReceivedCount++;
      }

      totalPackages += Number(s.totalPackages) || 0;
      const lbs = Number(s.totalWeightLbs) || 0;
      totalWeightLbs += lbs;
      totalWeightKg += Number(s.totalWeightKg) || convertLbsToKg(lbs);
      const cbm = Number(s.totalCbm) || 0;
      totalCbm += cbm;
      totalCft += Number(s.totalCft) || Number((cbm * 35.3147).toFixed(2));
    }

    const completionRatePercent = totalShipments > 0 ? Math.round((deliveredCount / totalShipments) * 100) : 0;
    const avgWeightPerShipmentLbs = totalShipments > 0 ? Math.round(totalWeightLbs / totalShipments) : 0;
    const avgVolumePerShipmentCbm = totalShipments > 0 ? Number((totalCbm / totalShipments).toFixed(2)) : 0;

    return {
      totalShipments,
      deliveredCount,
      inTransitCount,
      loadedSealedCount,
      cargoReceivedCount,
      completionRatePercent,
      totalPackages,
      totalWeightLbs: Number(totalWeightLbs.toFixed(2)),
      totalWeightKg: Number(totalWeightKg.toFixed(2)),
      totalCbm: Number(totalCbm.toFixed(2)),
      totalCft: Number(totalCft.toFixed(2)),
      avgWeightPerShipmentLbs,
      avgVolumePerShipmentCbm,
    };
  }

  async getHistory(filters: ShipmentHistoryFilterParams) {
    const { data, total, allMatching } = await this.repo.findShipments(filters);
    const enrichedData = data.map((s) => this.enrichShipment(s));
    const summary = this.calculateMetrics(allMatching);

    return {
      data: enrichedData,
      summary,
      total,
    };
  }

  async getHistoryById(idOrNumber: string): Promise<EnrichedHistoryShipment> {
    const item = await this.repo.findById(idOrNumber);
    if (!item) {
      throw new NotFoundError('Shipment History Record');
    }
    return this.enrichShipment(item);
  }
}

export const historyService = new HistoryService();
