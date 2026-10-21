import React, { useState, useEffect } from 'react';
import { Anchor, X, Save, Plus } from 'lucide-react';

export const VesselModal = ({
  isOpen,
  onClose,
  onSave,
  vessel = null,
  isEdit = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Merchant Vessel / Island Trader (80-120 ft)',
    notes: ''
  });

  useEffect(() => {
    if (vessel && isEdit) {
      setFormData({
        name: vessel.name || '',
        type: vessel.type || 'Merchant Vessel / Island Trader (80-120 ft)',
        notes: vessel.notes || ''
      });
    } else {
      setFormData({
        name: '',
        type: 'Merchant Vessel / Island Trader (80-120 ft)',
        notes: ''
      });
    }
  }, [vessel, isEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave({
      name: formData.name.trim(),
      type: formData.type || 'Merchant Vessel / Island Trader (80-120 ft)',
      notes: formData.notes?.trim() || ''
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Anchor size={20} style={{ color: '#0284C7' }} />
            <span>{isEdit ? `Edit Vessel: ${formData.name || ''}` : 'Add Vessel to Fleet Directory'}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '72vh', overflowY: 'auto' }}>
            <div className="form-group">
              <label className="form-label">Vessel Name <span className="required">*</span></label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. M/V Island Trader, Lady Rosalind"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
            </div>

            {/* Vessel classification / type field: retained pending client confirmation */}
            <div className="form-group">
              <label className="form-label">Vessel Classification / Type</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Merchant Vessel / Island Trader (80-120 ft)">Merchant Vessel / Island Trader (80-120 ft)</option>
                <option value="Coastal Breakbulk Freighter">Coastal Breakbulk Freighter</option>
                <option value="Small Cargo Feeder / Mailboat">Small Cargo Feeder / Mailboat</option>
                <option value="Geared Feeder Container Vessel">Geared Feeder Container Vessel</option>
                <option value="Cellular Container Ship">Cellular Container Ship</option>
                <option value="Ro-Ro / Container Carrier">Ro-Ro / Container Carrier</option>
              </select>
              <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                Classification reference for ocean freight manifests.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Optional fleet notes, carrier contact, dock details..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              {isEdit ? <Save size={14} /> : <Plus size={14} />}
              <span>{isEdit ? 'Save Changes' : 'Add Vessel'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
