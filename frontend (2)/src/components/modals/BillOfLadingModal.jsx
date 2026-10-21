import React, { useState, useEffect, useRef } from 'react';
import { FileText, X, Save, Plus } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';

export const BillOfLadingModal = ({
  isOpen,
  onClose,
  onSave,
  bl = null,
  isEdit = false
}) => {
  const { ports } = useAppData();
  const { currentUser, isAgent } = useAuth();
  const hasInitializedRef = useRef(false);

  const getPortCode = (p) => p?.portCode || p?.code || '';

  const getPolDefault = () => {
    const p = ports.find(pt => getPortCode(pt) === 'MIA' || getPortCode(pt) === 'USMIA');
    return p ? `${getPortCode(p)} - ${p.name}` : (ports[0] ? `${getPortCode(ports[0])} - ${ports[0].name}` : 'MIA - Port of Miami');
  };

  const getPodDefault = () => {
    const targetCode = isAgent ? currentUser?.destinationPortCode : null;
    const p = targetCode ? ports.find(pt => getPortCode(pt) === targetCode) : (ports[0] || null);
    return p ? `${getPortCode(p)} - ${p.name}` : '';
  };

  const [formData, setFormData] = useState({
    blNumber: '',
    issueDate: '',
    shipperName: '',
    shipperAddress: '',
    consigneeName: '',
    consigneeAddress: '',
    notifyPartyName: '',
    notifyPartyAddress: '',
    oceanVessel: '',
    voyageNumber: '',
    carrier: '',
    portOfLoading: '',
    portOfDischarge: '',
    containerNumber: '',
    sealNumber: 'BOLT-99281',
    cargoDescription: 'General Consignment: Commercial goods, packaged merchandise and freight.',
    packageCount: 120,
    packageType: 'Packages',
    grossWeightLbs: 8500,
    cbm: 28.5,
    freightTerms: 'Freight Prepaid',
    status: 'Draft'
  });

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const pol = getPolDefault();
    const pod = getPodDefault();

    if (bl && isEdit) {
      setFormData({
        blNumber: bl.blNumber || '',
        issueDate: bl.issueDate || bl.createdDate || new Date().toISOString().split('T')[0],
        shipperName: bl.shipper?.name || 'KERS Global Freight Forwarding Inc.',
        shipperAddress: bl.shipper?.address || '8200 NW 33rd Street, Miami, FL 33122 USA',
        consigneeName: bl.consignee?.name || '',
        consigneeAddress: bl.consignee?.address || '',
        notifyPartyName: bl.notifyParty?.name || '',
        notifyPartyAddress: bl.notifyParty?.address || '',
        oceanVessel: bl.oceanVessel || 'M/V Caribbean Voyager',
        voyageNumber: bl.voyageNumber || 'VOY-2026-088',
        carrier: bl.carrier || 'Tropical Shipping',
        portOfLoading: bl.portOfLoading || pol,
        portOfDischarge: bl.portOfDischarge || pod,
        containerNumber: bl.containerNumber || '',
        sealNumber: bl.sealNumber || 'BOLT-99281',
        cargoDescription: bl.cargoDescription || 'General Consignment',
        packageCount: bl.packageCount || 120,
        packageType: bl.packageType || 'Packages',
        grossWeightLbs: bl.grossWeightLbs || 8500,
        cbm: bl.cbm || 28.5,
        freightTerms: bl.freightTerms || 'Freight Prepaid',
        status: bl.status || 'Draft'
      });
    } else {
      setFormData({
        blNumber: `BL-VI-2026-${Math.floor(95 + Math.random() * 900)}`,
        issueDate: new Date().toISOString().split('T')[0],
        shipperName: '',
        shipperAddress: '',
        consigneeName: '',
        consigneeAddress: '',
        notifyPartyName: '',
        notifyPartyAddress: '',
        oceanVessel: '',
        voyageNumber: '',
        carrier: '',
        portOfLoading: pol,
        portOfDischarge: pod,
        containerNumber: '',
        sealNumber: '',
        cargoDescription: '',
        packageCount: 0,
        packageType: 'Packages',
        grossWeightLbs: 0,
        cbm: 0,
        freightTerms: 'Freight Prepaid',
        status: 'Draft'
      });
    }
  }, [isOpen, bl, isEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      blNumber: formData.blNumber,
      issueDate: formData.issueDate,
      agentId: bl?.agentId || currentUser?.agentId || null,
      agentName: bl?.agentName || (currentUser?.roleKey === 'agent' ? currentUser.name : ''),
      destinationPortCode: formData.portOfDischarge?.split(' - ')[0]?.trim() || '',
      shipper: {
        name: formData.shipperName,
        address: formData.shipperAddress
      },
      consignee: {
        name: formData.consigneeName,
        address: formData.consigneeAddress
      },
      notifyParty: {
        name: formData.notifyPartyName,
        address: formData.notifyPartyAddress
      },
      oceanVessel: formData.oceanVessel,
      voyageNumber: formData.voyageNumber,
      carrier: formData.carrier,
      portOfLoading: formData.portOfLoading,
      portOfDischarge: formData.portOfDischarge,
      containerNumber: formData.containerNumber,
      sealNumber: formData.sealNumber,
      cargoDescription: formData.cargoDescription,
      packageCount: Number(formData.packageCount) || 0,
      packageType: formData.packageType,
      grossWeightLbs: Number(formData.grossWeightLbs) || 0,
      grossWeightKg: Number(((Number(formData.grossWeightLbs) || 0) * 0.453592).toFixed(1)),
      cbm: Number(formData.cbm) || 0,
      cft: Number(((Number(formData.cbm) || 0) * 35.3147).toFixed(1)),
      freightTerms: formData.freightTerms,
      status: formData.status
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FileText size={20} style={{ color: '#0A192F' }} />
            <span>{isEdit ? `Edit Master Bill of Lading ${formData.blNumber}` : 'Create Master Bill of Lading (B/L)'}</span>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Master B/L Number <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  disabled={isEdit}
                  className="form-control"
                  value={formData.blNumber}
                  onChange={(e) => setFormData({ ...formData, blNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Issue Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                  Shipper / Forwarder Details
                </span>
                <div className="form-group">
                  <label className="form-label">Shipper Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.shipperName}
                    onChange={(e) => setFormData({ ...formData, shipperName: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Shipper Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.shipperAddress}
                    onChange={(e) => setFormData({ ...formData, shipperAddress: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                  Consignee Details <span className="required">*</span>
                </span>
                <div className="form-group">
                  <label className="form-label">Consignee Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Caribbean Distribution Ltd"
                    value={formData.consigneeName}
                    onChange={(e) => setFormData({ ...formData, consigneeName: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Consignee Address</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Bay Street, Nassau, Bahamas"
                    value={formData.consigneeAddress}
                    onChange={(e) => setFormData({ ...formData, consigneeAddress: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Ocean Vessel</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.oceanVessel}
                  onChange={(e) => setFormData({ ...formData, oceanVessel: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Voyage Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.voyageNumber}
                  onChange={(e) => setFormData({ ...formData, voyageNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Carrier</label>
                <input
                  type="text"
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
                  {formData.portOfLoading && !ports.some(p => `${getPortCode(p)} - ${p.name}` === formData.portOfLoading) && (
                    <option value={formData.portOfLoading}>{formData.portOfLoading}</option>
                  )}
                  {ports.map(p => {
                    const pCode = getPortCode(p);
                    return (
                      <option key={`pol-${p.id || pCode}`} value={`${pCode} - ${p.name}`}>
                        {pCode} — {p.name} ({p.island || p.country || 'Caribbean'})
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
                  required
                >
                  {formData.portOfDischarge && !ports.some(p => `${getPortCode(p)} - ${p.name}` === formData.portOfDischarge) && (
                    <option value={formData.portOfDischarge}>{formData.portOfDischarge}</option>
                  )}
                  {ports.map(p => {
                    const pCode = getPortCode(p);
                    return (
                      <option key={`pod-${p.id || pCode}`} value={`${pCode} - ${p.name}`}>
                        {pCode} — {p.name} ({p.island || p.country || 'Caribbean'})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Container Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.containerNumber}
                  onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bolt Seal Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.sealNumber}
                  onChange={(e) => setFormData({ ...formData, sealNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Cargo Description <span className="required">*</span></label>
              <textarea
                required
                className="form-control"
                rows={2}
                value={formData.cargoDescription}
                onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="form-group">
                <label className="form-label">Packages</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={formData.packageCount}
                  onChange={(e) => setFormData({ ...formData, packageCount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gross Weight (LBS)</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={formData.grossWeightLbs}
                  onChange={(e) => setFormData({ ...formData, grossWeightLbs: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Volume (CBM)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={formData.cbm}
                  onChange={(e) => setFormData({ ...formData, cbm: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">B/L Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Draft">Draft</option>
                  <option value="Released">Released</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              {isEdit ? <Save size={14} /> : <Plus size={14} />}
              <span>{isEdit ? 'Save B/L Changes' : 'Issue Master B/L'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
