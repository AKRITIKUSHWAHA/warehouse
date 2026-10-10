import React, { useState } from 'react';
import { BrandLogo } from '../common/BrandLogo';
import { StatusBadge } from '../common/StatusBadge';
import { BarcodeVisual } from '../common/BarcodeVisual';
import { Printer, Download, Layers, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAppData } from '../../context/AppDataContext';
import { downloadPdfFromElement } from '../../services/pdfService';

export const MasterBLViewer = ({ bl, linkedHbls = [], onNavigate }) => {
  const { showToast } = useToast();
  const { settings } = useAppData() || {};
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!bl) return null;

  const isOnHold = bl.status === 'On Hold' || bl.holdDetails?.isOnHold;
  const isReleased = bl.status === 'Released';

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = `Master_BL_${bl.blNumber || 'Document'}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1000);
    showToast(`Print layout loaded for Master B/L ${bl.blNumber}.`, 'info', 'Printing Document');
  };

  const handleDownloadPdf = async () => {
    if (isOnHold) {
      showToast(`Cannot download document: Master B/L is currently ON HOLD.`, 'danger', 'Download Restricted');
      return;
    }
    try {
      setIsDownloadingPdf(true);
      showToast(`Generating official PDF for Master B/L ${bl.blNumber}...`, 'info', 'Preparing PDF');
      const filename = `Master_BL_${bl.blNumber || 'Document'}.pdf`;
      const docElement = document.getElementById('printable-master-bl-doc');
      await downloadPdfFromElement(docElement, filename);
      showToast(`Master Bill of Lading ${bl.blNumber}.pdf downloaded successfully.`, 'success', 'Download Complete');
    } catch (err) {
      console.error('PDF download error:', err);
      showToast(`PDF generation error: ${err.message}`, 'danger', 'Download Failed');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Top Document Action Bar (hidden in print) */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', background: '#FFFFFF', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <StatusBadge status={bl.status} size="lg" />
          <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Issue Date: <strong>{bl.issueDate || bl.createdDate}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline btn-sm" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print B/L Document</span>
          </button>
          <button
            className={`btn btn-sm ${isOnHold ? 'btn-secondary disabled' : 'btn-primary'}`}
            onClick={handleDownloadPdf}
            disabled={isOnHold || isDownloadingPdf}
            title={isOnHold ? 'Locked: B/L is on hold' : 'Download Master B/L PDF'}
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

      {/* Printable B/L Document Container */}
      <div
        id="printable-master-bl-doc"
        className="printable-document-bl card"
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

        {isReleased && (
          <div style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-25deg)',
            fontSize: '4rem',
            fontWeight: 900,
            color: 'rgba(16, 185, 129, 0.12)',
            letterSpacing: '0.2em',
            pointerEvents: 'none',
            border: '5px solid rgba(16, 185, 129, 0.12)',
            padding: '0.5rem 2rem',
            borderRadius: '12px',
            userSelect: 'none',
            zIndex: 10
          }}>
            OFFICIAL RELEASED
          </div>
        )}

        {/* Header Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', borderBottom: '2px solid #0A192F', paddingBottom: '1rem', marginBottom: '0.75rem', gap: '1rem' }}>
          <div>
            <BrandLogo variant="dark" size="default" />
            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.4rem', lineHeight: 1.35 }}>
              <strong>{settings?.companyProfile?.legalName || settings?.companyProfile?.companyName || 'VI Customs Brokers & Logistics'}</strong><br />
              {settings?.companyProfile?.addressLine1 || '8400 NW 36th Street, Suite 500, Miami, FL 33166, USA'}<br />
              Tel: {settings?.companyProfile?.phone || '+1 (305) 555-5377'} | {settings?.companyProfile?.fmcNumber || 'FMC-OTI #028914N'}
            </div>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.05em', color: '#0A192F' }}>
                MASTER BILL OF LADING
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
                OCEAN CARGO CONSOLIDATION DOCUMENT
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>MASTER B/L NUMBER</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#D97706' }}>
                {bl.blNumber}
              </div>
            </div>
          </div>
        </div>

        {/* Shipper & Consignee 2-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid #0A192F', marginBottom: '0.75rem' }}>
          <div style={{ padding: '0.65rem', borderRight: '1px solid #0A192F', borderBottom: '1px solid #0A192F' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>1. SHIPPER / CONSOLIDATOR</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '2px' }}>{bl.shipper?.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '2px', whiteSpace: 'pre-line' }}>{bl.shipper?.address}</div>
            {bl.shipper?.taxId && <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Tax ID: {bl.shipper.taxId}</div>}
          </div>

          <div style={{ padding: '0.65rem', borderBottom: '1px solid #0A192F' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>2. BOOKING / CONSOLIDATION REF</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '2px' }}>
              {bl.consolidationId || bl.shipmentNumber || 'CNS-CONSOLIDATED'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '4px' }}>
              <strong>Carrier:</strong> {bl.carrier || 'Tropical Shipping Line'}<br />
              <strong>Terms:</strong> {bl.freightTerms || 'Freight Prepaid'}
            </div>
          </div>

          <div style={{ padding: '0.65rem', borderRight: '1px solid #0A192F' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>3. CONSIGNEE / DESTINATION AGENT</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '2px' }}>{bl.consignee?.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '2px', whiteSpace: 'pre-line' }}>{bl.consignee?.address}</div>
            {bl.consignee?.taxId && <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>TIN/VAT: {bl.consignee.taxId}</div>}
          </div>

          <div style={{ padding: '0.65rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>4. NOTIFY PARTY / INWARD DESK</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '2px' }}>{bl.notifyParty?.name || bl.agentName}</div>
            <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '2px', whiteSpace: 'pre-line' }}>{bl.notifyParty?.address}</div>
            {bl.notifyParty?.contact && <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Contact: {bl.notifyParty.contact}</div>}
          </div>
        </div>

        {/* Vessel & Ports Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid #0A192F', borderTop: 'none', marginBottom: '0.75rem', background: '#F8FAFC' }}>
          <div style={{ padding: '0.5rem', borderRight: '1px solid #0A192F' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748B' }}>PRE-CARRIAGE BY</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{bl.preCarriageBy || 'KERS Drayage'}</div>
          </div>
          <div style={{ padding: '0.5rem', borderRight: '1px solid #0A192F' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748B' }}>PLACE OF RECEIPT</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{bl.placeOfReceipt || 'CFS Miami'}</div>
          </div>
          <div style={{ padding: '0.5rem', borderRight: '1px solid #0A192F' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748B' }}>OCEAN VESSEL &amp; VOYAGE</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0A192F' }}>{bl.oceanVessel} ({bl.voyageNumber})</div>
          </div>
          <div style={{ padding: '0.5rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748B' }}>PORT OF LOADING</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{bl.portOfLoading}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', border: '1px solid #0A192F', borderTop: 'none', marginBottom: '0.75rem', background: '#F8FAFC' }}>
          <div style={{ padding: '0.5rem', borderRight: '1px solid #0A192F' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748B' }}>PORT OF DISCHARGE</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0284C7' }}>{bl.portOfDischarge}</div>
          </div>
          <div style={{ padding: '0.5rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748B' }}>PLACE OF FINAL DELIVERY</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{bl.placeOfDelivery || bl.portOfDischarge}</div>
          </div>
        </div>

        {/* Cargo Line Items Table */}
        <div style={{ border: '1px solid #0A192F', marginBottom: '0.75rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ background: '#0A192F', color: '#FFFFFF', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.4rem 0.5rem', width: '22%' }}>Marks &amp; Container #</th>
                <th style={{ padding: '0.4rem 0.5rem', width: '15%' }}>No. of Pkgs</th>
                <th style={{ padding: '0.4rem 0.5rem', width: '38%' }}>Description of Goods</th>
                <th style={{ padding: '0.4rem 0.5rem', width: '12%', textAlign: 'right' }}>Gross Weight</th>
                <th style={{ padding: '0.4rem 0.5rem', width: '13%', textAlign: 'right' }}>Measurement</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '0.75rem 0.5rem', verticalAlign: 'top', borderRight: '1px solid #E2E8F0', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}>
                  <strong>CONT:</strong> {bl.containerNumber}<br />
                  <strong>SEAL:</strong> {bl.sealNumber}<br />
                  <strong>TYPE:</strong> {bl.containerType || "40' HC"}
                </td>
                <td style={{ padding: '0.75rem 0.5rem', verticalAlign: 'top', borderRight: '1px solid #E2E8F0' }}>
                  <strong>{bl.packageCount}</strong> {bl.packageType || 'Packages'}<br />
                  {bl.totalPieces && <span style={{ fontSize: '0.7rem', color: '#64748B' }}>({bl.totalPieces} Pieces)</span>}
                </td>
                <td style={{ padding: '0.75rem 0.5rem', verticalAlign: 'top', borderRight: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 600, marginBottom: '2px' }}>{bl.cargoDescription}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                    {linkedHbls.length > 0
                      ? `CONSOLIDATED SHIPMENT CONTAINING ${linkedHbls.length} HOUSE BILL(S) OF LADING: ${linkedHbls.map(h => h.hblNumber).join(', ')}`
                      : '"SAID TO CONTAIN" — SHIPPERS LOAD, STOW & COUNT'}
                  </div>
                </td>
                <td style={{ padding: '0.75rem 0.5rem', verticalAlign: 'top', textAlign: 'right', borderRight: '1px solid #E2E8F0' }}>
                  <strong>{bl.grossWeightLbs?.toLocaleString()} LBS</strong><br />
                  <span style={{ fontSize: '0.7rem', color: '#64748B' }}>({bl.grossWeightKg?.toLocaleString()} KGS)</span>
                </td>
                <td style={{ padding: '0.75rem 0.5rem', verticalAlign: 'top', textAlign: 'right' }}>
                  <strong style={{ color: '#D97706' }}>{bl.cft || (bl.cbm ? Number((bl.cbm * 35.3147).toFixed(1)) : 0)} CFT</strong><br />
                  <span style={{ fontSize: '0.7rem', color: '#0284C7', fontWeight: 600 }}>({bl.cbm} CBM)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Freight Charges Breakdown */}
        {bl.charges && bl.charges.length > 0 && (
          <div style={{ border: '1px solid #0A192F', marginBottom: '0.75rem', padding: '0.5rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              FREIGHT &amp; CHARGES BREAKDOWN
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem' }}>
              {bl.charges.map((chg, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E2E8F0', paddingBottom: '2px' }}>
                  <span>{chg.description} ({chg.rate})</span>
                  <strong>${chg.amount?.toFixed(2)} USD {chg.prepaid ? '[PREPAID]' : '[COLLECT]'}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', fontWeight: 800, fontSize: '0.85rem' }}>
                <span>TOTAL FREIGHT DECLARED:</span>
                <span style={{ color: '#0A192F' }}>${bl.totalFreightUsd?.toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer & Signature Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', border: '1px solid #0A192F', padding: '0.75rem', gap: '1rem', background: '#F8FAFC' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#64748B', lineHeight: 1.35 }}>
              RECEIVED the goods in apparent good order and condition unless otherwise stated herein. IN WITNESS whereof the carrier has signed <strong>{bl.numberOfOriginals || '3 (THREE)'}</strong> Original Bills of Lading, all of this tenor and date, one of which being accomplished, the others to stand void.
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <BarcodeVisual value={bl.blNumber} height={35} showText={false} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '100%', borderBottom: '1px solid #0A192F', paddingBottom: '0.25rem', marginBottom: '0.25rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#0284C7' }}>
              Marcus Vance (Authorized Signature)
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B' }}>
              SIGNED FOR AND ON BEHALF OF THE CARRIER: VI Logistics
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
