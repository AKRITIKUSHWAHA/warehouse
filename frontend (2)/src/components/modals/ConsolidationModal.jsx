import React, { useState, useEffect, useRef } from 'react';
import { Layers, X, Save } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const ConsolidationModal = ({
  isOpen,
  onClose,
  onSave,
  consolidation = null
}) => {
  const { ports, vessels } = useAppData();
  const hasInitializedRef = useRef(false);

  const getPortCode = (p) => p?.portCode || p?.code || 'PORT';
  const defaultPort = ports[0] ? `${getPortCode(ports[0])} - ${ports[0].name}` : '';

  const [formData, setFormData] = useState({
    consolidationNumber: '',
    title: '',
    containerNumber: '',
    sealNumber: '',
    containerType: '40ft High Cube Dry',
    vesselName: vessels[0]?.name || '',
    carrier: 'Tropical Shipping',
    destinationPort: defaultPort,
    status: 'Loaded'
  });

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    if (consolidation) {
      setFormData({
        consolidationNumber: consolidation.consolidationNumber || '',
        title: consolidation.title || '',
        containerNumber: consolidation.containerNumber || '',
        sealNumber: consolidation.sealNumber || '',
        containerType: consolidation.containerType || '40ft High Cube Dry',
        vesselName: consolidation.vesselName || (vessels[0]?.name || ''),
        carrier: consolidation.carrier || 'Tropical Shipping',
        destinationPort: consolidation.destinationPort || defaultPort,
        status: consolidation.status || 'Loaded'
      });
    } else {
      setFormData({
        consolidationNumber: `CNS-2026-${Math.floor(100 + Math.random() * 899)}`,
        title: '',
        containerNumber: '',
        sealNumber: '',
        containerType: '40ft High Cube Dry',
        vesselName: vessels[0]?.name || '',
        carrier: 'Tropical Shipping',
        destinationPort: defaultPort,
        status: 'Loaded'
      });
    }
  }, [consolidation, isOpen, defaultPort, vessels]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const autoTitle = formData.title || (formData.containerNumber ? `Container ${formData.containerNumber}` : `Consolidation ${formData.consolidationNumber}`);
    onSave({ ...formData, title: autoTitle });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Layers size={20} style={{ color: '#1E4D8C' }} />
            <span>{consolidation ? `Edit Consolidation ${formData.consolidationNumber}` : 'New Ocean Container Consolidation'}</span>
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
                <label className="form-label">Consolidation Number <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control"
                  style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#0284C7' }}
                  value={formData.consolidationNumber}
                  onChange={(e) => setFormData({ ...formData, consolidationNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Container Number <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control"
                  style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}
                  value={formData.containerNumber}
                  placeholder="e.g. CMAU-109482-7"
                  onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Bolt Seal Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. SEAL-VI-91380"
                  value={formData.sealNumber}
                  onChange={(e) => setFormData({ ...formData, sealNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Container Type</label>
                <select
                  className="form-select"
                  value={formData.containerType}
                  onChange={(e) => setFormData({ ...formData, containerType: e.target.value })}
                >
                  <option value="40ft High Cube Dry">40ft High Cube Dry (76.2 CBM)</option>
                  <option value="40ft Standard Dry">40ft Standard Dry (67.7 CBM)</option>
                  <option value="20ft Standard Dry">20ft Standard Dry (33.2 CBM)</option>
                  <option value="45ft High Cube Dry">45ft High Cube Dry (86.0 CBM)</option>
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
                <label className="form-label">Destination Port</label>
                <select
                  className="form-select"
                  value={formData.destinationPort}
                  onChange={(e) => setFormData({ ...formData, destinationPort: e.target.value })}
                >
                  {ports.map(p => {
                    const pCode = getPortCode(p);
                    const val = `${pCode} - ${p.name}`;
                    return (
                      <option key={`cns-dest-${p.id || pCode}`} value={val}>
                        {pCode} — {p.name} ({p.island || p.country || 'Caribbean'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Consolidation Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Loaded">Loaded</option>
                  <option value="Sealed">Sealed</option>
                  <option value="Draft">Draft</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              <Save size={14} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
