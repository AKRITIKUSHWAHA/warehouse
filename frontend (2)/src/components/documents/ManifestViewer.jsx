import React, { useState } from 'react';
import { BrandLogo } from '../common/BrandLogo';
import { Printer, Download, FileSpreadsheet, FileCode, Layout, Compass } from 'lucide-react';
import { manifestService } from '../../services/manifestService';
import { useToast } from '../../context/ToastContext';
import { useAppData } from '../../context/AppDataContext';

export const ManifestViewer = ({ manifest }) => {
  const { showToast } = useToast();
  const { billsOfLading = [], houseBills = [], settings } = useAppData() || {};
  const [orientation, setOrientation] = useState('landscape'); // 'landscape' | 'portrait'

  if (!manifest) return null;

  const resolvedLineItems = (manifest.lineItems && manifest.lineItems.length > 0)
    ? manifest.lineItems
    : (() => {
        const blNum = manifest.masterBLNumber || manifest.masterBLId;
        if (!blNum) return [];
        const bl = billsOfLading.find(b => b.blNumber === blNum || b.id === blNum);
        if (!bl) return [];
        const linkedHbls = houseBills.filter(h =>
          h.assignedMasterBLId === bl.id ||
          h.assignedMasterBLId === bl.blNumber ||
          bl.houseBillIds?.includes(h.hblNumber)
        );
        if (linkedHbls.length > 0) {
          return linkedHbls.map((h, idx) => ({
            itemNumber: idx + 1,
            hblNumber: h.hblNumber,
            blNumber: bl.blNumber,
            shipper: typeof h.shipper === 'object' ? h.shipper.name : h.shipper || 'Miami CFS Hub',
            consignee: typeof h.consignee === 'object' ? h.consignee.name : h.consignee || h.customerName || 'Consignee',
            notifyParty: typeof h.notifyParty === 'object' ? h.notifyParty.name : h.notifyParty || bl.agentName || 'Port Destination Agent',
            containerNumber: bl.containerNumber || 'MSKU-829104-5',
            sealNumber: bl.sealNumber || 'SEAL-VI-8821',
            packageCount: h.totalPieces || h.totalPackages || 1,
            totalPieces: h.totalPieces || h.totalPackages || 1,
            packageType: 'Cartons / Pallets',
            cargoDescription: h.cargoDescription || 'Consolidated Cargo Goods',
            grossWeightLbs: Number(h.totalWeightLbs) || 0,
            grossWeightKg: Number(h.totalWeightKg) || Number(((Number(h.totalWeightLbs) || 0) * 0.453592).toFixed(1)),
            cft: Number(h.totalCft) || Number(((Number(h.totalCbm) || 0) * 35.3147).toFixed(2)),
            cbm: Number(h.totalCbm) || 0,
            customsValueUsd: Number(((h.totalPieces || 1) * 1250).toFixed(2)) || 25000.00
          }));
        }
        return [
          {
            itemNumber: 1,
            hblNumber: 'DIRECT',
            blNumber: bl.blNumber,
            shipper: typeof bl.shipper === 'object' ? bl.shipper.name : bl.shipper || 'Miami CFS Hub',
            consignee: typeof bl.consignee === 'object' ? bl.consignee.name : bl.consignee || 'Consignee',
            notifyParty: typeof bl.notifyParty === 'object' ? bl.notifyParty.name : bl.notifyParty || bl.agentName || 'Port Destination Agent',
            containerNumber: bl.containerNumber || 'MSKU-829104-5',
            sealNumber: bl.sealNumber || 'SEAL-VI-8821',
            packageCount: Number(bl.packageCount) || 1,
            packageType: bl.packageType || 'Packages',
            cargoDescription: bl.cargoDescription || 'Consolidated Sea Freight',
            grossWeightLbs: Number(bl.grossWeightLbs || bl.weightLbs) || 0,
            grossWeightKg: Number(bl.grossWeightKg) || Number(((Number(bl.grossWeightLbs || bl.weightLbs) || 0) * 0.453592).toFixed(1)),
            cft: Number(bl.cft) || 0,
            cbm: Number(bl.cbm) || 0,
            customsValueUsd: 25000.00
          }
        ];
      })();

  const activeManifest = {
    ...manifest,
    lineItems: resolvedLineItems,
    totalCft: manifest.totalCft && manifest.totalCft !== '0.00' && manifest.totalCft !== '0'
      ? manifest.totalCft
      : (resolvedLineItems[0]?.cft ? String(resolvedLineItems[0].cft) : (manifest.totalCbm ? (parseFloat(manifest.totalCbm) * 35.3147).toFixed(2) : '0.00'))
  };

  const handlePrint = () => {
    window.print();
    showToast(`Print layout loaded for Manifest ${activeManifest.manifestNumber} (${orientation} mode).`, 'info', 'Printing Manifest');
  };

  const handleExportCsv = () => {
    manifestService.exportCsv(activeManifest);
    showToast(`Exported CSV manifest for ${activeManifest.manifestNumber}.`, 'success', 'CSV Exported');
  };

  const handleExportXml = () => {
    manifestService.exportXml(activeManifest);
    showToast(`Exported Customs XML Ocean Manifest for ${activeManifest.manifestNumber}.`, 'success', 'Customs XML Exported');
  };

  const handleDownloadPdf = () => {
    window.print();
    showToast(`Print / Save as PDF layout ready for Manifest ${activeManifest.manifestNumber}.`, 'success', 'PDF Ready');
  };

  const isLandscape = orientation === 'landscape';

  return (
    <div style={{ maxWidth: isLandscape ? '1100px' : '850px', margin: '0 auto', transition: 'max-width 200ms ease' }}>
      {/* Document Controls Bar */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', background: '#FFFFFF', padding: '0.85rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '0.75rem' }}>
        {/* Orientation Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layout size={14} /> Manifest Orientation:
          </span>
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '2px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
            <button
              onClick={() => setOrientation('portrait')}
              className={`btn btn-sm ${!isLandscape ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            >
              Portrait Manifest
            </button>
            <button
              onClick={() => setOrientation('landscape')}
              className={`btn btn-sm ${isLandscape ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            >
              Landscape Manifest
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportCsv} title="Export Manifest to CSV file">
            <FileSpreadsheet size={15} style={{ color: '#059669' }} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleExportXml} title="Export Manifest to Customs XML file">
            <FileCode size={15} style={{ color: '#0284C7' }} />
            <span>Export XML</span>
          </button>
          <button className="btn btn-outline btn-sm" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print Manifest</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleDownloadPdf}>
            <Download size={15} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Manifest Document */}
      <div
        className={`printable-manifest orientation-${orientation} card`}
        style={{
          background: '#FFFFFF',
          border: '2px solid #0A192F',
          borderRadius: '4px',
          padding: isLandscape ? '1.5rem 2rem' : '1.5rem',
          color: '#0A192F',
          fontFamily: 'Arial, Helvetica, sans-serif'
        }}
      >
        {/* Document Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '2px solid #0A192F', paddingBottom: '0.85rem', marginBottom: '0.85rem' }}>
          <div>
            <BrandLogo variant="dark" size="small" />
            <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '4px' }}>
              {settings?.companyProfile?.legalName || settings?.companyProfile?.companyName || 'VI Customs Brokers & Logistics'} — Ocean Manifest Division
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.04em', color: '#0A192F' }}>
              OCEAN SHIPPING MANIFEST
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', fontFamily: 'JetBrains Mono, monospace' }}>
              MANIFEST NO: {activeManifest.manifestNumber}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
              Format: {isLandscape ? 'Standard Landscape' : 'Compact Portrait'}
            </div>
          </div>
        </div>

        {/* Voyage Information Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: isLandscape ? 'repeat(6, 1fr)' : 'repeat(3, 1fr)', border: '1px solid #0A192F', background: '#F8FAFC', marginBottom: '1rem', fontSize: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRight: '1px solid #E2E8F0', borderBottom: isLandscape ? 'none' : '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748B' }}>VESSEL NAME</div>
            <div style={{ fontWeight: 800 }}>{activeManifest.vesselName}</div>
          </div>
          <div style={{ padding: '0.5rem', borderRight: '1px solid #E2E8F0', borderBottom: isLandscape ? 'none' : '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748B' }}>VOYAGE NUMBER</div>
            <div style={{ fontWeight: 800 }}>{activeManifest.voyageNumber}</div>
          </div>
          <div style={{ padding: '0.5rem', borderRight: isLandscape ? '1px solid #E2E8F0' : 'none', borderBottom: isLandscape ? 'none' : '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748B' }}>CARRIER</div>
            <div style={{ fontWeight: 700 }}>{activeManifest.carrier || 'Tropical Shipping'}</div>
          </div>
          <div style={{ padding: '0.5rem', borderRight: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748B' }}>PORT OF LOADING</div>
            <div style={{ fontWeight: 700 }}>{activeManifest.portOfLoading}</div>
          </div>
          <div style={{ padding: '0.5rem', borderRight: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748B' }}>PORT OF DISCHARGE</div>
            <div style={{ fontWeight: 800, color: '#0284C7' }}>{activeManifest.portOfDischarge}</div>
          </div>
          <div style={{ padding: '0.5rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748B' }}>DEPARTURE / ETA</div>
            <div style={{ fontWeight: 700 }}>{activeManifest.departureDate} → {activeManifest.arrivalDate}</div>
          </div>
        </div>

        {/* Manifest Line Items Table */}
        <div style={{ border: '1px solid #0A192F', marginBottom: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ background: '#0A192F', color: '#FFFFFF', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.45rem 0.5rem', width: '4%' }}>#</th>
                <th style={{ padding: '0.45rem 0.5rem', width: '16%' }}>House / Master B/L</th>
                <th style={{ padding: '0.45rem 0.5rem', width: '17%' }}>Shipper</th>
                <th style={{ padding: '0.45rem 0.5rem', width: '17%' }}>Consignee &amp; Notify</th>
                <th style={{ padding: '0.45rem 0.5rem', width: '14%' }}>Container &amp; Seal</th>
                <th style={{ padding: '0.45rem 0.5rem', width: '8%', textAlign: 'center' }}>Pkgs</th>
                <th style={{ padding: '0.45rem 0.5rem', width: '14%' }}>Description of Cargo</th>
                <th style={{ padding: '0.45rem 0.5rem', width: '8%', textAlign: 'right' }}>Gross (KG)</th>
              </tr>
            </thead>
            <tbody>
              {(activeManifest.lineItems || []).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700 }}>{item.itemNumber || idx + 1}</td>
                  <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                    {item.hblNumber && (
                      <div style={{ fontWeight: 800, color: '#2563EB' }}>
                        HBL: {item.hblNumber}
                      </div>
                    )}
                    <div style={{ color: '#64748B', fontSize: '0.7rem' }}>
                      MBL: {item.blNumber}
                    </div>
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{item.shipper}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    <strong>{item.consignee}</strong>
                    {item.notifyParty && <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Notify: {item.notifyParty}</div>}
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}>
                    <div><strong>CONT:</strong> {item.containerNumber}</div>
                    <div style={{ color: '#64748B' }}><strong>SEAL:</strong> {item.sealNumber}</div>
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                    <strong>{item.packageCount}</strong><br />
                    <span style={{ fontSize: '0.68rem', color: '#64748B' }}>{item.packageType}</span>
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    <div style={{ fontWeight: 600 }}>{item.cargoDescription}</div>
                    {item.cft ? (
                      <div style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 700, marginTop: '2px' }}>
                        {item.cft} CFT <span style={{ color: '#0284C7', fontWeight: 600 }}>({item.cbm} CBM)</span>
                      </div>
                    ) : item.cbm ? (
                      <div style={{ fontSize: '0.7rem', color: '#0284C7', fontWeight: 600, marginTop: '2px' }}>
                        {item.cbm} CBM
                      </div>
                    ) : null}
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 700 }}>
                    {item.grossWeightKg?.toLocaleString()} KG<br />
                    <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 400 }}>({item.grossWeightLbs?.toLocaleString()} LBS)</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#F1F5F9', fontWeight: 800, fontSize: '0.75rem', borderTop: '2px solid #0A192F' }}>
                <td colSpan={5} style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>MANIFEST TOTALS:</td>
                <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>{activeManifest.totalPackages} PKGS</td>
                <td style={{ padding: '0.6rem 0.5rem', color: '#D97706' }}>
                  {activeManifest.totalCft ? `${activeManifest.totalCft} CFT` : ''} {activeManifest.totalCbm ? `(${activeManifest.totalCbm} CBM)` : ''}
                </td>
                <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', color: '#0A192F' }}>{activeManifest.totalWeightKg?.toLocaleString()} KG</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Master / Customs Certification Footer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', border: '1px solid #0A192F', padding: '0.75rem', gap: '1rem', background: '#F8FAFC', fontSize: '0.7rem' }}>
          <div>
            <strong>MASTER / AGENT DECLARATION:</strong><br />
            I hereby certify that this manifest contains a full, accurate, and true account of all cargo laden on board the above named vessel at the port of loading for discharge at the designated port of destination.
          </div>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ borderBottom: '1px solid #0A192F', paddingBottom: '0.2rem', marginBottom: '0.2rem', fontWeight: 700 }}>
              {activeManifest.masterName || 'Capt. Arthur Sterling (Master / Agent)'}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>
              CERTIFIED SIGNATURE &amp; CUSTOMS STAMP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
