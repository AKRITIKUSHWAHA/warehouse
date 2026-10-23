import React from 'react';
import { BarcodeVisual, QrVisual } from '../common/BarcodeVisual';
import { BrandLogo } from '../common/BrandLogo';
import { ArrowUp, Droplets, Box, Anchor } from 'lucide-react';

export const CargoLabel4x6 = ({
  cargo,
  pieceIndex = 1,
  totalPieces = 1
}) => {
  if (!cargo) return null;

  const cargoId = cargo.id || "CRG-2026-001";
  const wrNumber = cargo.receiptNumber || cargo.warehouseReceiptId || "WR-2026-1041";
  const customer = cargo.customer || cargo.customerName || cargo.consignee || "General Consignee";
  const shipper = cargo.shipper || "CFS Origin";
  const destination = cargo.destinationPort || "Destination Port";
  const description = cargo.description || cargo.cargoDescription || "General Freight Cargo";
  const weightLbs = cargo.weightLbs || (cargo.grossWeightLbs || 0);
  const weightKg = cargo.weightKg || Number((weightLbs * 0.453592).toFixed(1));
  const packagesCft = (cargo.packages && Array.isArray(cargo.packages) && cargo.packages.length > 0)
    ? cargo.packages.reduce((sum, p) => sum + (Number(p.cft) || 0), 0)
    : 0;
  const packagesCbm = (cargo.packages && Array.isArray(cargo.packages) && cargo.packages.length > 0)
    ? cargo.packages.reduce((sum, p) => sum + (Number(p.cbm) || 0), 0)
    : 0;

  const rawCft = (cargo.cft !== undefined && cargo.cft !== null && Number(cargo.cft) > 0)
    ? Number(cargo.cft)
    : packagesCft;
  const cft = rawCft > 0 ? Number(rawCft).toFixed(2) : 0;

  const rawCbm = (cargo.cbm !== undefined && cargo.cbm !== null && Number(cargo.cbm) > 0)
    ? Number(cargo.cbm)
    : (packagesCbm > 0 ? packagesCbm : Number((rawCft * 0.0283168).toFixed(2)));
  const cbm = rawCbm > 0 ? Number(rawCbm).toFixed(2) : 0;

  const totalPkgs = totalPieces || cargo.packageCount || cargo.totalPieces || 1;

  return (
    <div
      className="printable-label-4x6"
      style={{
        width: '350px',
        background: '#FFFFFF',
        border: '3px solid #000000',
        borderRadius: '6px',
        padding: '0.65rem 0.75rem',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
        boxSizing: 'border-box',
        color: '#000000',
        fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif'
      }}
    >
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #000000', paddingBottom: '0.35rem', marginBottom: '0.4rem' }}>
          <BrandLogo variant="dark" size="small" showSubtitle={false} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000000' }}>
              CARGO SHIPPING LABEL
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#000000' }}>
              4" × 6" THERMAL
            </div>
          </div>
        </div>

        {/* Destination Port Banner (EXTRA LARGE & BOLD) */}
        <div style={{ background: '#000000', color: '#FFFFFF', padding: '0.35rem 0.5rem', borderRadius: '4px', textAlign: 'center', marginBottom: '0.4rem' }}>
          <div style={{ fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#38BDF8', fontWeight: 800 }}>
            DESTINATION PORT
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.03em', lineHeight: 1.15, marginTop: '2px' }}>
            {destination.toUpperCase()}
          </div>
        </div>

        {/* Primary Identification: WR Number & Piece Count (BIG TEXT) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '0.4rem', marginBottom: '0.4rem', background: '#F8FAFC', border: '2px solid #000000', borderRadius: '5px', padding: '0.35rem 0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>
              WAREHOUSE RECEIPT #
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: '#000000', letterSpacing: '-0.02em' }}>
              {wrNumber}
            </div>
          </div>

          <div style={{ textAlign: 'right', borderLeft: '2px solid #CBD5E1', paddingLeft: '0.4rem' }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>
              PIECE COUNT
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0284C7' }}>
              {pieceIndex} <span style={{ fontSize: '0.75rem', color: '#000000', fontWeight: 700 }}>OF</span> {totalPkgs}
            </div>
          </div>
        </div>

        {/* Consignee / Customer */}
        <div style={{ marginBottom: '0.4rem', borderBottom: '2px solid #000000', paddingBottom: '0.35rem' }}>
          <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>
            CONSIGNEE / IMPORTER
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#000000', lineHeight: 1.2, margin: '2px 0' }}>
            {customer}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#1E293B', fontWeight: 600 }}>
            <strong>Goods:</strong> {description}
          </div>
        </div>

        {/* Metrics Grid: CFT IS PRIMARY */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.4rem', background: '#F1F5F9', padding: '0.35rem 0.5rem', borderRadius: '5px', border: '2px solid #000000', marginBottom: '0.4rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>
              VOLUME (CFT PRIMARY)
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#000000' }}>
              {cft} <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>CFT</span>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569' }}>
              ({cbm} CBM)
            </div>
          </div>

          <div style={{ borderLeft: '2px solid #CBD5E1', paddingLeft: '0.4rem' }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>
              GROSS WEIGHT
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#000000' }}>
              {weightLbs} <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>LBS</span>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569' }}>
              ({weightKg} KG)
            </div>
          </div>
        </div>
      </div>

      {/* Barcode & QR Code Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', marginBottom: '0.35rem', background: '#FFFFFF', padding: '0.2rem 0' }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <BarcodeVisual value={cargo.barcode || `${wrNumber}-${pieceIndex}`} height={46} showText={true} />
          </div>
          <div style={{ flexShrink: 0 }}>
            <QrVisual value={cargo.qrCode || cargo.barcode || cargo.cargoNumber || `VI-CARGO-${wrNumber}-${pieceIndex}`} size={58} />
          </div>
        </div>

        {/* Footer Handling Symbols (NO Warehouse Location) */}
        <div style={{ borderTop: '2px solid #000000', paddingTop: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div title="This Side Up" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', fontWeight: 900 }}>
              <ArrowUp size={13} strokeWidth={3} /> THIS SIDE UP
            </div>
            <div title="Keep Dry" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', fontWeight: 900 }}>
              <Droplets size={13} strokeWidth={3} /> KEEP DRY
            </div>
          </div>

          <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#000000', letterSpacing: '0.05em' }}>
            KERS CARIBBEAN CFS
          </div>
        </div>
      </div>
    </div>
  );
};
