import { apiClient } from './apiClient';
import { getStored, KEYS } from './storageService';

/**
 * Helper to compute local flow stages & calculations fallback
 */
function enrichShipmentFallback(s) {
  const totalWeightLbs = Number(s.totalWeightLbs) || 0;
  const totalWeightKg = Number(s.totalWeightKg) || Number((totalWeightLbs * 0.453592).toFixed(2));
  const totalCbm = Number(s.totalCbm) || 0;
  const totalCft = Number(s.totalCft) || Number((totalCbm * 35.3147).toFixed(2));
  const totalPackages = Number(s.totalPackages) || 0;
  const densityKgPerCbm = totalCbm > 0 ? Number((totalWeightKg / totalCbm).toFixed(2)) : 0;
  const volumetricWeightLbs = Number((totalCbm * 771.6).toFixed(2));
  const chargeableWeightLbs = Math.max(totalWeightLbs, volumetricWeightLbs);

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

  const getStageStatus = (stageIdx) => {
    if (currentStageNumber > stageIdx) return 'completed';
    if (currentStageNumber === stageIdx) return 'current';
    return 'pending';
  };

  const flowStages = [
    {
      stageNumber: 1,
      key: 'intake',
      name: 'Warehouse Cargo Intake',
      subtitle: 'Receiving, Scale & Dimension Verification',
      status: getStageStatus(1),
      date: s.createdDate,
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
      date: s.createdDate,
      location: s.origin || 'Consolidation Bay 4',
      details: {
        consolidationId: s.consolidationId || 'CNS-AUTO',
        billOfLading: s.billOfLadingNumber || 'MBL-PENDING',
        blStatus: s.blStatus || 'Issued',
      },
      calculationNotes: `Consolidation container volume density: ${densityKgPerCbm} kg/CBM.`,
    },
    {
      stageNumber: 3,
      key: 'loading',
      name: 'Container Loading & Sealing',
      subtitle: 'Container Packing & High-Security Seal Applied',
      status: getStageStatus(3),
      date: s.createdDate,
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
      },
      calculationNotes: `Ocean voyage en route from ${s.origin} to ${s.destinationPort}.`,
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
      },
      calculationNotes: `Vessel discharge and Customs manifest documentation at ${s.destinationCode || 'NAS'}.`,
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
      },
      calculationNotes: s.status === 'Delivered'
        ? `Consignment completed and archived with full audit chain.`
        : `Awaiting destination port cargo handover.`,
    },
  ];

  return {
    ...s,
    flowProgressPercent,
    currentStageNumber,
    totalPackages,
    totalWeightLbs,
    totalWeightKg,
    totalCbm,
    totalCft,
    densityKgPerCbm,
    chargeableWeightLbs,
    flowStages,
  };
}

export const historyService = {
  /**
   * Fetch shipment history with calculations, metrics, and flow stages
   */
  async getShipmentHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.status && params.status !== 'All') queryParams.append('status', params.status);
      if (params.destinationCode && params.destinationCode !== 'All') queryParams.append('destinationCode', params.destinationCode);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.page) queryParams.append('page', String(params.page));
      if (params.limit) queryParams.append('limit', String(params.limit || 50));

      const qs = queryParams.toString();
      const url = qs ? `/history/shipments?${qs}` : '/history/shipments';

      const res = await apiClient.get(url);
      if (res && res.data) {
        return {
          data: Array.isArray(res.data) ? res.data : (res.data.items || []),
          summary: res.summary || null,
          total: res.meta?.total || (Array.isArray(res.data) ? res.data.length : 0),
        };
      }
    } catch (err) {
      console.warn('[historyService] Backend API notice, calculating from local store:', err.message);
    }

    // Local fallback calculation engine
    const rawShipments = getStored(KEYS.SHIPMENTS) || [];
    let filtered = [...rawShipments];

    if (params.status && params.status !== 'All') {
      const st = params.status.toLowerCase();
      filtered = filtered.filter(s => (s.status || '').toLowerCase().includes(st));
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(s =>
        (s.shipmentNumber && s.shipmentNumber.toLowerCase().includes(q)) ||
        (s.trackingNumber && s.trackingNumber.toLowerCase().includes(q)) ||
        (s.vesselName && s.vesselName.toLowerCase().includes(q)) ||
        (s.containerNumber && s.containerNumber.toLowerCase().includes(q)) ||
        (s.destinationPort && s.destinationPort.toLowerCase().includes(q)) ||
        (s.billOfLadingNumber && s.billOfLadingNumber.toLowerCase().includes(q))
      );
    }

    const enriched = filtered.map(s => enrichShipmentFallback(s));

    // Calculate Summary Metrics
    let deliveredCount = 0;
    let inTransitCount = 0;
    let loadedSealedCount = 0;
    let cargoReceivedCount = 0;
    let totalPackages = 0;
    let totalWeightLbs = 0;
    let totalWeightKg = 0;
    let totalCbm = 0;
    let totalCft = 0;

    for (const s of enriched) {
      const st = (s.status || '').toLowerCase();
      if (st.includes('deliver') || st.includes('release')) deliveredCount++;
      else if (st.includes('transit') || st.includes('arrived')) inTransitCount++;
      else if (st.includes('loaded') || st.includes('seal') || st.includes('consolidat')) loadedSealedCount++;
      else cargoReceivedCount++;

      totalPackages += s.totalPackages;
      totalWeightLbs += s.totalWeightLbs;
      totalWeightKg += s.totalWeightKg;
      totalCbm += s.totalCbm;
      totalCft += s.totalCft;
    }

    const summary = {
      totalShipments: enriched.length,
      deliveredCount,
      inTransitCount,
      loadedSealedCount,
      cargoReceivedCount,
      completionRatePercent: enriched.length > 0 ? Math.round((deliveredCount / enriched.length) * 100) : 0,
      totalPackages,
      totalWeightLbs: Number(totalWeightLbs.toFixed(2)),
      totalWeightKg: Number(totalWeightKg.toFixed(2)),
      totalCbm: Number(totalCbm.toFixed(2)),
      totalCft: Number(totalCft.toFixed(2)),
      avgWeightPerShipmentLbs: enriched.length > 0 ? Math.round(totalWeightLbs / enriched.length) : 0,
      avgVolumePerShipmentCbm: enriched.length > 0 ? Number((totalCbm / enriched.length).toFixed(2)) : 0,
    };

    return {
      data: enriched,
      summary,
      total: enriched.length,
    };
  },

  /**
   * Fetch single shipment history with full flow trace
   */
  async getShipmentHistoryById(id) {
    try {
      const res = await apiClient.get(`/history/shipments/${id}`);
      if (res && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('[historyService] Single history API error:', err.message);
    }

    const rawShipments = getStored(KEYS.SHIPMENTS) || [];
    const found = rawShipments.find(s => s.id === id || s.shipmentNumber === id || s.trackingNumber === id);
    return found ? enrichShipmentFallback(found) : null;
  }
};
