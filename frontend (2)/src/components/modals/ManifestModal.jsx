import React, { useState, useEffect, useRef } from 'react';
import { FileSpreadsheet, X, Save, Plus, Anchor, Sparkles } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const ManifestModal = ({
  isOpen,
  onClose,
  onSave,
  manifest = null,
  isEdit = false
}) => {
  const { billsOfLading, ports, vessels, houseBills, customers = [] } = useAppData();
  const hasInitializedRef = useRef(false);

  const getPortCode = (p) => p?.portCode || p?.code || '';
  const firstPort = ports && ports.length > 0 ? ports[0] : null;
  const defaultPod = firstPort ? `${getPortCode(firstPort)} - ${firstPort.name}` : '';

  const [selectedMasterBLId, setSelectedMasterBLId] = useState('');
  const [formData, setFormData] = useState({
    manifestNumber: `MNF-2026-${Math.floor(400 + Math.random() * 600)}`,
    title: 'Ocean Cargo Customs Manifest',
    masterBLId: '',
    carrier: '',
    vesselName: '',
    voyageNumber: '',
    portOfLoading: 'Port of Miami (USMIA), FL',
    portOfDischarge: defaultPod,
    departureDate: new Date().toISOString().split('T')[0],
    arrivalDate: '',
    masterName: '',
    status: 'Generated & Active',
    totalPackages: 0,
    totalWeightKg: 0,
    totalWeightLbs: 0,
    totalCft: 0,
    totalCbm: 0,
    totalBLs: 1,
    lineItems: []
  });

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    const curPod = firstPort ? `${getPortCode(firstPort)} - ${firstPort.name}` : '';
    if (manifest && isEdit) {
      setFormData({
        manifestNumber: manifest.manifestNumber || '',
        title: manifest.title || '',
        masterBLId: manifest.masterBLId || '',
        carrier: manifest.carrier || '',
        vesselName: manifest.vesselName || '',
        voyageNumber: manifest.voyageNumber || '',
        portOfLoading: manifest.portOfLoading || 'Port of Miami (USMIA), FL',
        portOfDischarge: manifest.portOfDischarge || curPod,
        departureDate: manifest.departureDate || '',
        arrivalDate: manifest.arrivalDate || '',
        masterName: manifest.masterName || '',
        status: manifest.status || 'Generated & Active',
        totalPackages: manifest.totalPackages || 0,
        totalWeightKg: manifest.totalWeightKg || 0,
        totalWeightLbs: manifest.totalWeightLbs || 0,
        totalCft: manifest.totalCft || 0,
        totalCbm: manifest.totalCbm || 0,
        totalBLs: manifest.totalBLs || 1,
        lineItems: manifest.lineItems || []
      });
      setSelectedMasterBLId(manifest.masterBLId || '');
    } else {
      setFormData({
        manifestNumber: `MNF-2026-${Math.floor(400 + Math.random() * 600)}`,
        title: 'Ocean Cargo Customs Manifest',
        masterBLId: '',
        carrier: '',
        vesselName: '',
        voyageNumber: '',
        portOfLoading: 'Port of Miami (USMIA), FL',
        portOfDischarge: curPod,
        departureDate: new Date().toISOString().split('T')[0],
        arrivalDate: '',
        masterName: '',
        status: 'Generated & Active',
        totalPackages: 0,
        totalWeightKg: 0,
        totalWeightLbs: 0,
        totalCft: 0,
        totalCbm: 0,
        totalBLs: 0,
        lineItems: []
      });
      setSelectedMasterBLId('');
    }
  }, [manifest, isEdit, isOpen]);

  if (!isOpen) return null;

  // Handle Master B/L Selection -> Auto-populate all information & line items
  const handleSelectMasterBL = (blId) => {
    setSelectedMasterBLId(blId);
    if (!blId) return;

    const bl = billsOfLading.find(b => b.id === blId || b.blNumber === blId);
    if (bl) {
      // Find linked House B/Ls if any
      const linkedHbls = houseBills.filter(h => 
        h.assignedMasterBLId === bl.id ||
        h.assignedMasterBLId === bl.blNumber ||
        bl.houseBillIds?.includes(h.hblNumber)
      );

      let lineItems = [];
      let totalPackages = 0;
      let totalWeightLbs = 0;
      let totalCft = 0;
      let totalCbm = 0;

      if (linkedHbls.length > 0) {
        lineItems = linkedHbls.map((h, idx) => {
          const hWeightLbs = Number(h.totalWeightLbs || h.weightLbs || 0);
          const hCbm = Number(h.totalCbm || h.cbm || 0);
          const hCft = Number(h.totalCft || h.cft || (hCbm ? (hCbm * 35.3147).toFixed(2) : 0));
          const hPackages = Number(h.totalPieces || h.totalPackages || 1);

          totalPackages += hPackages;
          totalWeightLbs += hWeightLbs;
          totalCft += hCft;
          totalCbm += hCbm;

          return {
            itemNumber: idx + 1,
            hblNumber: h.hblNumber,
            blNumber: bl.blNumber,
            shipper: typeof h.shipper === 'object' ? h.shipper.name : h.shipper || 'CFS Miami Hub',
            consignee: typeof h.consignee === 'object' ? h.consignee.name : h.consignee || 'Consignee',
            notifyParty: typeof h.notifyParty === 'object' ? h.notifyParty.name : h.notifyParty || bl.agentName || 'Port Destination Agent',
            containerNumber: bl.containerNumber || 'MSKU-829104-5',
            sealNumber: bl.sealNumber || 'SEAL-VI-8821',
            packageCount: hPackages,
            totalPieces: hPackages,
            packageType: 'Cartons / Packages',
            cargoDescription: h.cargoDescription || 'Consolidated Cargo Goods',
            grossWeightLbs: hWeightLbs,
            grossWeightKg: Number(h.totalWeightKg) || Number((hWeightLbs * 0.453592).toFixed(1)),
            cft: hCft,
            cbm: hCbm
          };
        });
      } else {
        // Direct single entry from Master B/L
        totalPackages = Number(bl.packageCount || bl.totalPieces || 1);
        totalWeightLbs = Number(bl.grossWeightLbs || bl.totalWeightLbs || bl.weightLbs || 0);
        totalCbm = Number(bl.cbm || 0);
        totalCft = Number(bl.cft || (totalCbm ? (totalCbm * 35.3147).toFixed(2) : 0));

        lineItems = [
          {
            itemNumber: 1,
            hblNumber: 'DIRECT',
            blNumber: bl.blNumber,
            shipper: typeof bl.shipper === 'object' ? bl.shipper.name : bl.shipper || 'CFS Miami Hub',
            consignee: typeof bl.consignee === 'object' ? bl.consignee.name : bl.consignee || 'Consignee',
            notifyParty: typeof bl.notifyParty === 'object' ? bl.notifyParty.name : bl.notifyParty || bl.agentName || 'Port Destination Agent',
            containerNumber: bl.containerNumber || 'MSKU-829104-5',
            sealNumber: bl.sealNumber || 'SEAL-VI-8821',
            packageCount: totalPackages,
            totalPieces: totalPackages,
            packageType: bl.packageType || 'Packages',
            cargoDescription: bl.cargoDescription || 'Consolidated Sea Freight',
            grossWeightLbs: totalWeightLbs,
            grossWeightKg: Number(bl.grossWeightKg) || Number((totalWeightLbs * 0.453592).toFixed(1)),
            cft: totalCft,
            cbm: totalCbm
          }
        ];
      }

      const totalWeightKg = Number((totalWeightLbs * 0.453592).toFixed(1));

      setFormData(prev => ({
        ...prev,
        masterBLId: bl.id || bl.blNumber,
        title: `Ocean Cargo Manifest — ${bl.oceanVessel || 'Vessel'} (${bl.voyageNumber || 'Voyage'})`,
        carrier: bl.carrier || 'Tropical Shipping',
        vesselName: bl.oceanVessel || bl.vesselName || '',
        voyageNumber: bl.voyageNumber || '',
        portOfLoading: bl.portOfLoading || prev.portOfLoading,
        portOfDischarge: bl.portOfDischarge || prev.portOfDischarge,
        arrivalDate: bl.etaDate || '',
        totalPackages,
        totalWeightLbs,
        totalWeightKg,
        totalCft: Number(totalCft.toFixed(2)),
        totalCbm: Number(totalCbm.toFixed(2)),
        totalBLs: lineItems.length || 1,
        lineItems
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FileSpreadsheet size={20} style={{ color: '#059669' }} />
            <span>{isEdit ? `Edit Manifest ${formData.manifestNumber}` : 'Create Customs Shipping Manifest'}</span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault();
            }
          }}
        >
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '72vh', overflowY: 'auto' }}>
            
            {/* Option A: Select Saved Master B/L Bar */}
            {!isEdit && (
              <div style={{ background: '#EFF6FF', border: '2px solid #93C5FD', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem' }}>
                  <Sparkles size={16} style={{ color: '#0284C7' }} />
                  <label className="form-label" style={{ fontWeight: 800, color: '#1E40AF', margin: 0 }}>
                    Select Saved Master Bill of Lading (Auto-Generate Manifest)
                  </label>
                </div>
                <select
                  className="form-select"
                  value={selectedMasterBLId}
                  onChange={(e) => handleSelectMasterBL(e.target.value)}
                  style={{ background: '#FFFFFF', borderColor: '#3B82F6', fontWeight: 600 }}
                >
                  <option value="">-- Choose Master B/L or fill blank slate manually below --</option>
                  {billsOfLading.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.blNumber} — {b.oceanVessel || b.vesselName} ({b.voyageNumber}) → {b.portOfDischarge}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.72rem', color: '#1E40AF', marginTop: '4px' }}>
                  Choosing a Master B/L automatically loads Vessel, Voyage, Port of Loading, Port of Discharge, and all linked House B/L cargo lines into this manifest.
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Manifest Number <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  disabled={isEdit}
                  className="form-control"
                  value={formData.manifestNumber}
                  onChange={(e) => setFormData({ ...formData, manifestNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Manifest Header Title <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ocean Outward / Inward Customs Manifest"
                  className="form-control"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Vessel Name <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M/V Island Trader"
                  className="form-control"
                  value={formData.vesselName}
                  onChange={(e) => setFormData({ ...formData, vesselName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Voyage Number</label>
                <input
                  type="text"
                  placeholder="e.g. VOY-2026-19"
                  className="form-control"
                  value={formData.voyageNumber}
                  onChange={(e) => setFormData({ ...formData, voyageNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Carrier / Vessel Operator</label>
                <input
                  type="text"
                  placeholder="e.g. Merchant Cargo Line"
                  className="form-control"
                  value={formData.carrier}
                  onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Port of Loading (POL)</label>
                <select
                  className="form-select"
                  value={formData.portOfLoading}
                  onChange={(e) => setFormData({ ...formData, portOfLoading: e.target.value })}
                >
                  {ports.map(p => {
                    const pCode = getPortCode(p);
                    return (
                      <option key={`mnf-pol-${p.id || pCode}`} value={`${pCode} - ${p.name}`}>
                        {pCode} — {p.name} ({p.island || p.country})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Port of Discharge (POD) <span className="required">*</span></label>
                <select
                  className="form-select"
                  value={formData.portOfDischarge}
                  onChange={(e) => setFormData({ ...formData, portOfDischarge: e.target.value })}
                >
                  {ports.map(p => {
                    const pCode = getPortCode(p);
                    return (
                      <option key={`mnf-pod-${p.id || pCode}`} value={`${pCode} - ${p.name}`}>
                        {pCode} — {p.name} ({p.island || p.country})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Departure Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.departureDate}
                  onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Arrival Date (ETA)</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.arrivalDate}
                  onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ship Master / Captain</label>
                <input
                  type="text"
                  placeholder="e.g. Capt. Arthur Sterling"
                  className="form-control"
                  value={formData.masterName}
                  onChange={(e) => setFormData({ ...formData, masterName: e.target.value })}
                />
              </div>
            </div>

            {/* Manifest Cargo Volume Preview (CFT Primary) */}
            {formData.lineItems?.length > 0 && (
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                  Loaded Cargo Lines: <strong>{formData.lineItems.length} B/L Line Item(s)</strong> ({formData.totalPackages} Total Packages)
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#D97706' }}>
                  Total Volume: {formData.totalCft} CFT ({formData.totalCbm} CBM)
                </span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Manifest Customs Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Generated & Active">Generated & Active</option>
                <option value="Customs Cleared">Customs Cleared</option>
                <option value="Pending Submission">Pending Submission</option>
                <option value="On Customs Hold">On Customs Hold</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              {isEdit ? <Save size={14} /> : <Plus size={14} />}
              <span>{isEdit ? 'Save Manifest Changes' : 'Create Manifest'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
