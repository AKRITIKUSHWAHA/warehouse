import React, { useState, useEffect, useRef } from 'react';
import { Ship, X, Save, Plus, Box, Check, ArrowRight } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const ShipmentModal = ({
  isOpen,
  onClose,
  onSave,
  shipment = null,
  isEdit = false,
  initialConsolidation = null,
  availableConsolidations = []
}) => {
  const { ports = [], vessels = [] } = useAppData();
  const hasInitializedRef = useRef(false);
  const getPortCode = (p) => p?.portCode || p?.code || '';
  const defaultOrigin = ports.find(p => getPortCode(p) === 'MIA') ? 'MIA - Port of Miami' : (ports[0] ? `${getPortCode(ports[0])} - ${ports[0].name}` : 'MIA - Port of Miami');
  const defaultDest = ports[0] ? `${getPortCode(ports[0])} - ${ports[0].name}` : '';
  const defaultDestCode = ports[0] ? getPortCode(ports[0]) : '';

  const [formData, setFormData] = useState({
    shipmentNumber: '',
    trackingNumber: '',
    origin: defaultOrigin,
    destinationPort: defaultDest,
    destinationCode: defaultDestCode,
    vesselName: vessels[0]?.name || '',
    carrier: '',
    containerNumber: '',
    sealNumber: '',
    totalPackages: 0,
    totalWeightLbs: 0,
    totalCbm: 0,
    etd: new Date().toISOString().split('T')[0],
    eta: '',
    status: 'Cargo Received',
    blStatus: 'Draft',
    agentName: '',
    consolidationId: ''
  });

  const applyConsolidationToForm = (consol, baseState = {}) => {
    let matchedDest = consol.destinationPort || defaultDest;
    if (matchedDest && !matchedDest.includes(' - ')) {
      const p = ports.find(pt => getPortCode(pt) === consol.destinationCode || pt.name?.toLowerCase().includes(matchedDest.toLowerCase()));
      if (p) matchedDest = `${getPortCode(p)} - ${p.name}`;
    }

    return {
      ...baseState,
      consolidationId: consol.id || consol.consolidationNumber,
      containerNumber: consol.containerNumber || '',
      sealNumber: consol.sealNumber || '',
      destinationPort: matchedDest,
      destinationCode: consol.destinationCode || (matchedDest ? matchedDest.split(' - ')[0] : defaultDestCode),
      vesselName: consol.vesselName || vessels[0]?.name || '',
      carrier: consol.carrier || '',
      totalPackages: Number(consol.totalPackages) || 0,
      totalWeightLbs: Number(consol.totalWeightLbs) || 0,
      totalCbm: Number(consol.totalCbm) || 0,
      status: 'Consolidated',
      blStatus: 'Draft'
    };
  };

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    if (shipment && isEdit) {
      setFormData({
        shipmentNumber: shipment.shipmentNumber || '',
        trackingNumber: shipment.trackingNumber || '',
        origin: shipment.origin || defaultOrigin,
        destinationPort: shipment.destinationPort || defaultDest,
        destinationCode: shipment.destinationCode || defaultDestCode,
        vesselName: shipment.vesselName || (vessels[0]?.name || ''),
        carrier: shipment.carrier || '',
        containerNumber: shipment.containerNumber || '',
        sealNumber: shipment.sealNumber || '',
        totalPackages: shipment.totalPackages || 0,
        totalWeightLbs: shipment.totalWeightLbs || 0,
        totalCbm: shipment.totalCbm || 0,
        etd: shipment.etd || new Date().toISOString().split('T')[0],
        eta: shipment.eta || '',
        status: shipment.status || 'Cargo Received',
        blStatus: shipment.blStatus || 'Draft',
        agentName: shipment.agentName || '',
        consolidationId: shipment.consolidationId || ''
      });
    } else {
      const baseNew = {
        shipmentNumber: `SHP-2026-${Math.floor(100 + Math.random() * 900)}`,
        trackingNumber: `TRK-VI-${Math.floor(100000 + Math.random() * 900000)}`,
        origin: defaultOrigin,
        destinationPort: defaultDest,
        destinationCode: defaultDestCode,
        vesselName: vessels[0]?.name || '',
        carrier: '',
        containerNumber: '',
        sealNumber: '',
        totalPackages: 0,
        totalWeightLbs: 0,
        totalCbm: 0,
        etd: new Date().toISOString().split('T')[0],
        eta: '',
        status: 'Consolidated',
        blStatus: 'Draft',
        agentName: '',
        consolidationId: ''
      };

      if (initialConsolidation) {
        setFormData(applyConsolidationToForm(initialConsolidation, baseNew));
      } else {
        setFormData(baseNew);
      }
    }
  }, [shipment, isEdit, isOpen, defaultOrigin, defaultDest, defaultDestCode, vessels, initialConsolidation]);

  if (!isOpen) return null;

  const handleSelectBox = (consolId) => {
    if (!consolId) {
      setFormData(prev => ({
        ...prev,
        consolidationId: '',
        containerNumber: '',
        sealNumber: '',
        totalPackages: 0,
        totalWeightLbs: 0,
        totalCbm: 0
      }));
      return;
    }
    const consol = (availableConsolidations || []).find(c => c.id === consolId || c.consolidationNumber === consolId);
    if (consol) {
      setFormData(prev => applyConsolidationToForm(consol, prev));
    }
  };

  const selectedConsol = (availableConsolidations || []).find(c =>
    (formData.consolidationId && (c.id === formData.consolidationId || c.consolidationNumber === formData.consolidationId))
  ) || initialConsolidation;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      totalPackages: Number(formData.totalPackages) || 0,
      totalWeightLbs: Number(formData.totalWeightLbs) || 0,
      totalCbm: Number(formData.totalCbm) || 0
    });
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '86vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.925rem', color: '#0A192F' }}>
            <Ship size={18} style={{ color: '#0284C7' }} />
            <span>{isEdit ? `Edit Shipment ${formData.shipmentNumber}` : 'Shipment Ready Form (Proceed to Master B/L)'}</span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}>
            <X size={17} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault();
            }
          }}
          style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1rem 1.25rem', maxHeight: '68vh', overflowY: 'auto' }}>
            
            {/* Box Link Banner / Dropdown if not editing */}
            {!isEdit && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedConsol ? (
                  <div
                    style={{
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>📦</span>
                      <div>
                        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#166534' }}>
                          Selected Box: {selectedConsol.consolidationNumber}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#15803D' }}>
                          Container: {formData.containerNumber || selectedConsol.containerNumber || 'TBD'} • Seal: {formData.sealNumber || selectedConsol.sealNumber || 'N/A'} • {formData.totalPackages} pkgs • {formData.totalWeightLbs} lbs
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: '#DCFCE7',
                        color: '#166534',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        border: '1px solid #86EFAC'
                      }}
                    >
                      ✓ Auto-Filled
                    </span>
                  </div>
                ) : availableConsolidations && availableConsolidations.length > 0 ? (
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px', fontWeight: 600, color: '#0369A1' }}>
                      📦 Select Container Box to Ship (Auto-Fills Form)
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.825rem', padding: '0.45rem 0.65rem', borderColor: '#7DD3FC', backgroundColor: '#F0F9FF' }}
                      value={formData.consolidationId || ''}
                      onChange={(e) => handleSelectBox(e.target.value)}
                    >
                      <option value="">-- Choose a Container Box to Auto-Fill --</option>
                      {availableConsolidations.map(c => (
                        <option key={`box-opt-${c.id || c.consolidationNumber}`} value={c.id || c.consolidationNumber}>
                          {c.consolidationNumber} — Cont: {c.containerNumber || 'TBD'} ({c.destinationPort || 'No Dest'}) [{c.totalPackages || 0} pkgs, {c.totalWeightLbs || 0} lbs]
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Shipment Number <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  disabled={isEdit}
                  className="form-control"
                  style={{ fontSize: '0.825rem', padding: '0.4rem 0.65rem' }}
                  value={formData.shipmentNumber}
                  onChange={(e) => setFormData({ ...formData, shipmentNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Master Tracking Number <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control"
                  style={{ fontSize: '0.825rem', padding: '0.4rem 0.65rem' }}
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Origin Port / Facility</label>
                <select
                  className="form-select"
                  style={{ fontSize: '0.825rem', padding: '0.4rem 0.65rem' }}
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                >
                  {ports.map(p => {
                    const pCode = p.portCode || p.code || 'PORT';
                    return (
                      <option key={`shp-orig-${p.id || pCode}`} value={`${pCode} - ${p.name}`}>
                        {pCode} — {p.name} ({p.island || p.country || 'Caribbean'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Destination Port / Island <span className="required">*</span></label>
                <select
                  className="form-select"
                  style={{ fontSize: '0.825rem', padding: '0.4rem 0.65rem' }}
                  value={formData.destinationPort}
                  onChange={(e) => {
                    const code = e.target.value.split(' - ')[0];
                    setFormData({ ...formData, destinationPort: e.target.value, destinationCode: code });
                  }}
                  required
                >
                  {ports.map(p => {
                    const pCode = p.portCode || p.code || 'PORT';
                    return (
                      <option key={`shp-dest-${p.id || pCode}`} value={`${pCode} - ${p.name}`}>
                        {pCode} — {p.name} ({p.island || p.country || 'Caribbean'})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Vessel Name</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '0.825rem', padding: '0.4rem 0.65rem' }}
                  value={formData.vesselName}
                  onChange={(e) => setFormData({ ...formData, vesselName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Ocean Carrier</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '0.825rem', padding: '0.4rem 0.65rem' }}
                  value={formData.carrier}
                  onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Assigned Container #</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '0.825rem', padding: '0.4rem 0.65rem' }}
                  placeholder="e.g. MEDU7891234"
                  value={formData.containerNumber}
                  onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Bolt Seal Number</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '0.825rem', padding: '0.4rem 0.65rem' }}
                  placeholder="e.g. BOLT-99281"
                  value={formData.sealNumber}
                  onChange={(e) => setFormData({ ...formData, sealNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Total Packages</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  style={{ fontSize: '0.825rem', padding: '0.4rem 0.65rem' }}
                  value={formData.totalPackages}
                  onChange={(e) => setFormData({ ...formData, totalPackages: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Gross Weight (LBS)</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  style={{ fontSize: '0.825rem', padding: '0.4rem 0.65rem' }}
                  value={formData.totalWeightLbs}
                  onChange={(e) => setFormData({ ...formData, totalWeightLbs: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Total Volume (CBM)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  style={{ fontSize: '0.825rem', padding: '0.4rem 0.65rem' }}
                  value={formData.totalCbm}
                  onChange={(e) => setFormData({ ...formData, totalCbm: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Shipment Status</label>
                <select
                  className="form-select"
                  style={{ fontSize: '0.825rem', padding: '0.4rem 0.65rem' }}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Cargo Received">Cargo Received</option>
                  <option value="Consolidated">Consolidated</option>
                  <option value="Loaded & Sealed">Loaded & Sealed</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Arrived at Port">Arrived at Port</option>
                  <option value="Delivered / Released">Delivered / Released</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '3px' }}>Master B/L Status</label>
                <select
                  className="form-select"
                  style={{ fontSize: '0.825rem', padding: '0.4rem 0.65rem' }}
                  value={formData.blStatus}
                  onChange={(e) => setFormData({ ...formData, blStatus: e.target.value })}
                >
                  <option value="Draft">Draft</option>
                  <option value="Released">Released</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', background: '#F8FAFC' }}>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isEdit ? (
                <>
                  <Save size={14} />
                  <span>Save Shipment Changes</span>
                </>
              ) : (
                <>
                  <Ship size={14} />
                  <span>Confirm Shipment & Go to Master B/L ➔</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
