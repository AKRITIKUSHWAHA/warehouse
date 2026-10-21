import React, { useState, useEffect, useRef } from 'react';
import { Ship, X, Save, Plus } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const ShipmentModal = ({
  isOpen,
  onClose,
  onSave,
  shipment = null,
  isEdit = false
}) => {
  const { ports, vessels } = useAppData();
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
    totalWeightLbs: 8500,
    totalCbm: 28.5,
    etd: '2026-09-02',
    eta: '2026-09-06',
    status: 'Cargo Received',
    blStatus: 'Draft',
    agentName: 'Nassau Freight Logistics Ltd'
  });

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
        agentName: shipment.agentName || ''
      });
    } else {
      setFormData({
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
        status: 'Cargo Received',
        blStatus: 'Draft',
        agentName: ''
      });
    }
  }, [shipment, isEdit, isOpen, defaultOrigin, defaultDest, defaultDestCode, vessels]);

  if (!isOpen) return null;

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
    <div className="modal-backdrop">
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Ship size={20} style={{ color: '#0A192F' }} />
            <span>{isEdit ? `Edit Shipment ${formData.shipmentNumber}` : 'Create Direct Ocean Shipment'}</span>
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
                <label className="form-label">Shipment Number <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  disabled={isEdit}
                  className="form-control"
                  value={formData.shipmentNumber}
                  onChange={(e) => setFormData({ ...formData, shipmentNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Master Tracking Number <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Origin Port / Facility</label>
                <select
                  className="form-select"
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
                <label className="form-label">Destination Port / Island <span className="required">*</span></label>
                <select
                  className="form-select"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Vessel Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.vesselName}
                  onChange={(e) => setFormData({ ...formData, vesselName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ocean Carrier</label>
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
                <label className="form-label">Assigned Container #</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. MEDU7891234"
                  value={formData.containerNumber}
                  onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bolt Seal Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. BOLT-99281"
                  value={formData.sealNumber}
                  onChange={(e) => setFormData({ ...formData, sealNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Total Packages</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={formData.totalPackages}
                  onChange={(e) => setFormData({ ...formData, totalPackages: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gross Weight (LBS)</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={formData.totalWeightLbs}
                  onChange={(e) => setFormData({ ...formData, totalWeightLbs: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total Volume (CBM)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  className="form-control"
                  value={formData.totalCbm}
                  onChange={(e) => setFormData({ ...formData, totalCbm: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Shipment Status</label>
                <select
                  className="form-select"
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
                <label className="form-label">Master B/L Status</label>
                <select
                  className="form-select"
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

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              {isEdit ? <Save size={14} /> : <Plus size={14} />}
              <span>{isEdit ? 'Save Shipment Changes' : 'Create Shipment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
