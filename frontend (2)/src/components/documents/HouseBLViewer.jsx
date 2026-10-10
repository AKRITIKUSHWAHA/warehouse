import React, { useState } from 'react';
import { BrandLogo } from '../common/BrandLogo';
import { StatusBadge } from '../common/StatusBadge';
import { BarcodeVisual, QrVisual } from '../common/BarcodeVisual';
import { Printer, Download, Building2, Package, Layers, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { downloadPdfFromElement } from '../../services/pdfService';

export const HouseBLViewer = ({ hbl, onNavigate }) => {
  const { showToast } = useToast();
  const { currentUser } = useAuth() || {};
  const { settings, warehouseReceipts = [] } = useAppData() || {};
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!hbl) return null;

  const isOnHold = hbl.status === 'On Hold' || hbl.holdDetails?.isOnHold;
  const isReleased = hbl.status === 'Released' || hbl.status === 'Active';

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = `House_Bill_${hbl.hblNumber || 'Document'}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1000);
    showToast(`Print layout loaded for House B/L ${hbl.hblNumber}.`, 'info', 'Printing House B/L');
  };

  const handleDownloadPdf = async () => {
    if (isOnHold) {
      showToast(`Cannot download document: House B/L is currently ON HOLD.`, 'danger', 'Download Restricted');
      return;
    }
    try {
      setIsDownloadingPdf(true);
      showToast(`Generating official PDF for House B/L ${hbl.hblNumber}...`, 'info', 'Preparing PDF');
      const filename = `House_Bill_${hbl.hblNumber || 'Document'}.pdf`;
      const docElement = document.getElementById('printable-house-bl-doc');
      await downloadPdfFromElement(docElement, filename);
      showToast(`House Bill of Lading ${hbl.hblNumber}.pdf downloaded successfully.`, 'success', 'Download Complete');
    } catch (err) {
      console.error('PDF download error:', err);
      showToast(`PDF generation error: ${err.message}`, 'danger', 'Download Failed');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const packages = hbl.packages && hbl.packages.length > 0 ? hbl.packages : [];

  const carrierDisplayName = settings?.companyProfile?.companyName || settings?.companyProfile?.legalName || 'VI Customs Brokers & Logistics';
  const resolvedWrNumbers = (hbl.warehouseReceiptIds || []).map(id => {
    const matched = warehouseReceipts.find(w => w.id === id || w.receiptNumber === id);
    return matched?.receiptNumber || id;
  });

  const charges = hbl.freightCharges || hbl.charges || (() => {
    if (hbl.notes && typeof hbl.notes === 'string' && hbl.notes.includes('---FREIGHT_CHARGES---')) {
      try {
        const parts = hbl.notes.split('\n---FREIGHT_CHARGES---\n');
        return JSON.parse(parts[1]);
      } catch (e) {
        return null;
      }
    }
    return null;
  })();

  const oceanCharge = charges?.oceanFreightAmount !== undefined && charges?.oceanFreightAmount !== null
    ? Number(charges.oceanFreightAmount).toFixed(2)
    : (hbl.totalCft ? (Number(hbl.totalCft) * 3.5).toFixed(2) : '150.00');

  const terminalFee = charges?.terminalHandlingFee !== undefined && charges?.terminalHandlingFee !== null
    ? Number(charges.terminalHandlingFee).toFixed(2)
    : '35.00';

  const docFee = charges?.documentationFee !== undefined && charges?.documentationFee !== null
    ? Number(charges.documentationFee).toFixed(2)
    : '50.00';

  const totalCharge = charges?.totalAmount !== undefined && charges?.totalAmount !== null
    ? Number(charges.totalAmount).toFixed(2)
    : (hbl.totalCft ? (Number(oceanCharge) + Number(terminalFee) + Number(docFee)).toFixed(2) : '235.00');

  return (
    <div className="house-bl-viewer-wrapper" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', background: '#FFFFFF', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <StatusBadge status={hbl.status} size="lg" />
          <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Issue Date: <strong>{hbl.issueDate || hbl.createdDate}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline btn-sm" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print House B/L</span>
          </button>
          <button
            className={`btn btn-sm ${isOnHold ? 'btn-secondary disabled' : 'btn-primary'}`}
            onClick={handleDownloadPdf}
            disabled={isOnHold || isDownloadingPdf}
            title={isOnHold ? 'Locked: HBL is on hold' : 'Download House B/L PDF'}
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 size={15} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Downloading PDF...</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Download Official PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Traceability Flow Bar */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '0.65rem 1rem', borderRadius: '6px', border: '1px solid #E2E8F0', marginBottom: '1rem', fontSize: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#64748B', fontWeight: 600 }}>Customer:</span>
          {hbl.customerId && onNavigate ? (
            <button
              onClick={() => onNavigate('customers', hbl.customerId)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.15rem 0.4rem', color: '#0284C7', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Building2 size={13} />
              <span>{hbl.customerName}</span>
            </button>
          ) : (
            <strong style={{ color: '#0A192F' }}>{hbl.customerName}</strong>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#64748B', fontWeight: 600 }}>Linked WRs:</span>
            <span style={{ fontWeight: 700, color: '#D97706' }}>{hbl.warehouseReceiptIds?.length || 0} Receipt(s)</span>
          </div>

          {hbl.assignedConsolidationId ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Consolidation:</span>
              <button
                onClick={() => onNavigate && onNavigate('consolidations', hbl.assignedConsolidationId)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.15rem 0.4rem', color: '#059669', fontWeight: 700, fontSize: '0.8rem' }}
              >
                <Layers size={13} />
                <span>{hbl.assignedConsolidationId}</span>
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: '#0284C7', background: '#E0F2FE', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              Eligible for Consolidation
            </span>
          )}
        </div>
      </div>

      {/* Printable Document Container */}
      <div
        id="printable-house-bl-doc"
        className="printable-document-hbl card"
        style={{
          background: '#FFFFFF',
          border: '2px solid #0A192F',
          borderRadius: '4px',
          padding: '1.5rem',
          color: '#0A192F',
          fontFamily: 'Arial, Helvetica, sans-serif',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Dynamic Watermark based on status */}
        {isOnHold && (
          <div style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            fontSize: '4.5rem',
            fontWeight: 900,
            color: 'rgba(239, 68, 68, 0.14)',
            letterSpacing: '0.2em',
            pointerEvents: 'none',
            border: '6px solid rgba(239, 68, 68, 0.14)',
            padding: '0.5rem 2rem',
            borderRadius: '12px',
            userSelect: 'none',
            zIndex: 10
          }}>
            ON HOLD
          </div>
        )}

        {/* Header Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', borderBottom: '2px solid #0A192F', paddingBottom: '1rem', marginBottom: '0.75rem', gap: '1rem' }}>
          <div>
            <BrandLogo variant="dark" size="default" />
            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.4rem', lineHeight: 1.35 }}>
              <strong>{carrierDisplayName}</strong><br />
              {settings?.companyProfile?.addressLine1 || '8400 NW 36th Street, Suite 500, Miami, FL 33166, USA'}<br />
              Tel: {settings?.companyProfile?.phone || '+1 (305) 555-5377'} | {settings?.companyProfile?.fmcNumber || 'FMC-OTI #028914N'}
            </div>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.05em', color: '#0A192F' }}>
                HOUSE BILL OF LADING
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
                MULTIMODAL TRANSPORT DOCUMENT
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>HOUSE B/L NUMBER</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#2563EB' }}>
                {hbl.hblNumber}
              </div>
            </div>
          </div>
        </div>

        {/* Shipper & Consignee 2-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid #0A192F', marginBottom: '0.75rem' }}>
          <div style={{ padding: '0.65rem', borderRight: '1px solid #0A192F', borderBottom: '1px solid #0A192F' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>1. SHIPPER / EXPORTER</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '2px' }}>
              {typeof hbl.shipper === 'object' ? hbl.shipper.name : hbl.shipper}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '2px', whiteSpace: 'pre-line' }}>
              {typeof hbl.shipper === 'object' ? hbl.shipper.address : ''}
            </div>
          </div>

          <div style={{ padding: '0.65rem', borderBottom: '1px solid #0A192F' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>2. CARRIER &amp; ROUTING REFERENCES</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '2px' }}>
              {carrierDisplayName} Non-Vessel Operating Common Carrier (NVOCC)
            </div>
            <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '4px' }}>
              <strong>Terms:</strong> {hbl.freightTerms || 'Freight Prepaid'}<br />
              <strong>Linked WRs:</strong> {resolvedWrNumbers.length > 0 ? resolvedWrNumbers.join(', ') : 'Direct'}
            </div>
          </div>

          <div style={{ padding: '0.65rem', borderRight: '1px solid #0A192F' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>3. CONSIGNEE</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '2px' }}>
              {typeof hbl.consignee === 'object' ? hbl.consignee.name : hbl.consignee || hbl.customerName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '2px', whiteSpace: 'pre-line' }}>
              {typeof hbl.consignee === 'object' ? hbl.consignee.address : ''}
            </div>
            {hbl.consignee?.taxId && (
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>TIN/VAT: {hbl.consignee.taxId}</div>
            )}
          </div>

          <div style={{ padding: '0.65rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>4. NOTIFY PARTY / DESTINATION AGENT</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '2px' }}>
              {typeof hbl.notifyParty === 'object' ? hbl.notifyParty.name : hbl.notifyParty || hbl.agentName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '2px', whiteSpace: 'pre-line' }}>
              {typeof hbl.notifyParty === 'object' ? hbl.notifyParty.address : ''}
            </div>
          </div>
        </div>

        {/* Ports Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid #0A192F', borderTop: 'none', marginBottom: '0.75rem', background: '#F8FAFC' }}>
          <div style={{ padding: '0.5rem', borderRight: '1px solid #0A192F' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748B' }}>PORT OF LOADING (POL)</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{hbl.originPort || 'Port of Miami (USMIA), FL'}</div>
          </div>
          <div style={{ padding: '0.5rem', borderRight: '1px solid #0A192F' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748B' }}>PORT OF DISCHARGE (POD)</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0284C7' }}>{hbl.destinationPort}</div>
          </div>
          <div style={{ padding: '0.5rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748B' }}>CONSOLIDATION / MASTER REF</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: hbl.assignedConsolidationId ? '#059669' : '#64748B' }}>
              {hbl.assignedConsolidationId || 'Pending Container Assignment'}
            </div>
          </div>
        </div>

        {/* Cargo Specification & Packages Table */}
        <div style={{ border: '1px solid #0A192F', marginBottom: '0.75rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ background: '#0A192F', color: '#FFFFFF', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.4rem 0.5rem', width: '20%' }}>Marks &amp; Numbers</th>
                <th style={{ padding: '0.4rem 0.5rem', width: '15%' }}>Pieces / Pkgs</th>
                <th style={{ padding: '0.4rem 0.5rem', width: '40%' }}>Description of Goods &amp; Linked WRs</th>
                <th style={{ padding: '0.4rem 0.5rem', width: '12%', textAlign: 'right' }}>Gross Weight</th>
                <th style={{ padding: '0.4rem 0.5rem', width: '13%', textAlign: 'right' }}>Measurement</th>
              </tr>
            </thead>
            <tbody>
              {packages.length > 0 ? (
                packages.map((pkg, idx) => (
                  <tr key={pkg.id || idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.6rem 0.5rem', verticalAlign: 'top', borderRight: '1px solid #E2E8F0', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}>
                      <strong>{pkg.id}</strong><br />
                      <span style={{ color: '#64748B' }}>{hbl.destinationCode}/HBL/{idx + 1}</span>
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem', verticalAlign: 'top', borderRight: '1px solid #E2E8F0' }}>
                      <strong>{pkg.pieces || 1}</strong> {pkg.packageType || 'Packages'}
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem', verticalAlign: 'top', borderRight: '1px solid #E2E8F0' }}>
                      <div style={{ fontWeight: 600 }}>{pkg.description || hbl.cargoDescription}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                        Dimensions: {pkg.lengthInches}" × {pkg.widthInches}" × {pkg.heightInches}"
                      </div>
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem', verticalAlign: 'top', textAlign: 'right', borderRight: '1px solid #E2E8F0' }}>
                      <strong>{pkg.weightLbs} LBS</strong>
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem', verticalAlign: 'top', textAlign: 'right' }}>
                      <strong style={{ color: '#D97706' }}>{pkg.cft} CFT</strong><br />
                      <span style={{ fontSize: '0.68rem', color: '#64748B' }}>({pkg.cbm} CBM)</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={{ padding: '0.75rem 0.5rem', borderRight: '1px solid #E2E8F0', fontFamily: 'JetBrains Mono, monospace' }}>
                    HBL/{hbl.hblNumber}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', borderRight: '1px solid #E2E8F0' }}>
                    <strong>{hbl.totalPieces || hbl.totalPackages}</strong> Consolidated Pieces
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', borderRight: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 600 }}>{hbl.cargoDescription}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                      Linked Warehouse Receipts: {resolvedWrNumbers.length > 0 ? resolvedWrNumbers.join(', ') : (hbl.warehouseReceiptIds?.join(', ') || 'N/A')}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', borderRight: '1px solid #E2E8F0' }}>
                    <strong>{hbl.totalWeightLbs} LBS</strong><br />
                    <span style={{ fontSize: '0.7rem', color: '#64748B' }}>({hbl.totalWeightKg} KG)</span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                    <strong style={{ color: '#D97706' }}>{hbl.totalCft} CFT</strong><br />
                    <span style={{ fontSize: '0.7rem', color: '#64748B' }}>({hbl.totalCbm} CBM)</span>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#F8FAFC', fontWeight: 800, borderTop: '2px solid #0A192F' }}>
                <td colSpan={1} style={{ padding: '0.55rem 0.5rem' }}>HOUSE B/L TOTALS:</td>
                <td style={{ padding: '0.55rem 0.5rem', color: '#0284C7' }}>{hbl.totalPieces || hbl.totalPackages} PCS</td>
                <td style={{ padding: '0.55rem 0.5rem' }}>Across {hbl.warehouseReceiptIds?.length || 1} WR(s)</td>
                <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right' }}>{hbl.totalWeightLbs?.toLocaleString()} LBS</td>
                <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', color: '#D97706' }}>{hbl.totalCft} CFT ({hbl.totalCbm} CBM)</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Freight Rating & Charge Summary Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid #0A192F', background: '#F0FDF4', padding: '0.65rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.72rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#166534' }}>OCEAN FREIGHT</div>
            <div style={{ fontWeight: 800, color: '#0A192F' }}>
              ${oceanCharge} USD
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#166534' }}>CFS &amp; TERMINAL FEE</div>
            <div style={{ fontWeight: 700 }}>
              ${terminalFee} USD
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#166534' }}>DOCUMENTATION FEE</div>
            <div style={{ fontWeight: 700 }}>
              ${docFee} USD
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#166534' }}>TOTAL CHARGES ({hbl.freightTerms?.toUpperCase() || 'PREPAID'})</div>
            <div style={{ fontWeight: 900, color: '#16A34A', fontSize: '0.95rem', fontFamily: 'JetBrains Mono, monospace' }}>
              ${totalCharge} USD
            </div>
          </div>
        </div>

        {/* Footer & Barcode Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', border: '1px solid #0A192F', padding: '0.75rem', gap: '1rem', background: '#F8FAFC' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#64748B', lineHeight: 1.35 }}>
              RECEIVED the goods in apparent good order and condition. IN WITNESS whereof the carrier has issued this House Bill of Lading.
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <BarcodeVisual value={hbl.hblNumber} height={35} showText={false} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '100%', borderBottom: '1px solid #0A192F', paddingBottom: '0.25rem', marginBottom: '0.25rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#0284C7' }}>
              {hbl.issuedBy || (currentUser?.name ? `${currentUser.name} (${currentUser.role || 'Documentation Officer'})` : 'Authorized Documentation Officer')}
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B' }}>
              AUTHORIZED SIGNATURE FOR {carrierDisplayName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
