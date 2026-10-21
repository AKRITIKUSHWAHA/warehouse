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
    carrier: '',
    notes: ''
  });

  useEffect(() => {
    if (vessel && isEdit) {
      setFormData({
        name: vessel.name || '',
        carrier: vessel.carrier || '',
        notes: vessel.notes || ''
      });
    } else {
      setFormData({
        name: '',
        carrier: '',
        notes: ''
      });
    }
  }, [vessel, isEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Anchor size={20} style={{ color: '#0284C7' }} />
            <span>{isEdit ? `Edit Vessel: ${formData.name}` : 'Add Vessel to Fleet Directory'}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Vessel Name <span className="required">*</span></label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. M/V Tropic Island, Lady Rosalind"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Carrier / Shipping Line (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Tropical Shipping, MSC, Seaboard"
                value={formData.carrier}
                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Optional notes or operational remarks..."
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
