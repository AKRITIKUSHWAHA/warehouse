export interface CargoFilterParams {
  search?: string;
  status?: string;
  destinationCode?: string;
  agentId?: string | null;
  agentName?: string | null;
  warehouseReceiptId?: string;
  limit: number;
  offset: number;
}

export interface CreateCargoInput {
  cargoNumber?: string;
  id?: string;
  warehouseReceiptId?: string | null;
  receiptNumber?: string | null;
  customer: string;
  description: string;
  packageCount?: number;
  totalPieces?: number;
  packageType?: string;
  lengthInches?: number | null;
  widthInches?: number | null;
  heightInches?: number | null;
  weightLbs?: number | null;
  weightKg?: number | null;
  cft?: number | null;
  cbm?: number | null;
  warehouseLocation?: string;
  destinationPort?: string;
  destinationCode?: string;
  agentId?: string | null;
  agentName?: string | null;
  status?: string;
  barcode?: string;
  qrCode?: string;
}

export interface UpdateCargoInput extends Partial<CreateCargoInput> {}

