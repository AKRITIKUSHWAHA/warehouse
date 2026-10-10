export interface ShipmentFlowStage {
  stageNumber: number;
  key: 'intake' | 'consolidation' | 'loading' | 'transit' | 'arrival' | 'delivery';
  name: string;
  subtitle: string;
  status: 'completed' | 'current' | 'pending';
  date?: string;
  location?: string;
  details?: Record<string, any>;
  calculationNotes?: string;
}

export interface EnrichedHistoryShipment {
  id: string;
  shipmentNumber: string;
  trackingNumber: string;
  type: string;
  serviceMode: string;
  status: string;
  flowProgressPercent: number;
  currentStageNumber: number;
  origin: string;
  destination: string;
  destinationPort: string;
  destinationCode: string;
  agentName?: string | null;
  carrier?: string | null;
  vesselName?: string | null;
  voyageNumber?: string | null;
  containerNumber?: string | null;
  containerType?: string | null;
  sealNumber?: string | null;
  billOfLadingNumber?: string | null;
  blStatus?: string | null;
  manifestNumber?: string | null;
  etd?: string | null;
  eta?: string | null;
  createdDate: string;
  
  // Dynamic Calculations
  totalPackages: number;
  totalWeightLbs: number;
  totalWeightKg: number;
  totalCbm: number;
  totalCft: number;
  densityKgPerCbm: number;
  chargeableWeightLbs: number;
  estimatedTransitDays: number;
  
  // Full Lifecycle Flow
  flowStages: ShipmentFlowStage[];
  checkpoints: any[];
}

export interface ShipmentHistoryMetrics {
  totalShipments: number;
  deliveredCount: number;
  inTransitCount: number;
  loadedSealedCount: number;
  cargoReceivedCount: number;
  completionRatePercent: number;
  totalPackages: number;
  totalWeightLbs: number;
  totalWeightKg: number;
  totalCbm: number;
  totalCft: number;
  avgWeightPerShipmentLbs: number;
  avgVolumePerShipmentCbm: number;
}

export interface ShipmentHistoryFilterParams {
  search?: string;
  status?: string;
  destinationCode?: string;
  dateFrom?: string;
  dateTo?: string;
  limit: number;
  offset: number;
}
