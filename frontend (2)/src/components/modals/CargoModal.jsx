import React, { useState, useEffect, useRef } from 'react';
import { Box, X, Save, Plus } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const CargoModal = ({
  isOpen,
  onClose,
  onSave,
  cargo = null,
  isEdit = false
}) => {
  const { ports, customers } = useAppData();
  const hasInitializedRef = useRef(false);

  const getPortCode = (p) => p?.portCode || p?.code || 'PORT';
  const defaultPort = ports[0] ? `${getPortCode(ports[0])} - ${ports[0].name}` : 'NAS - Nassau, Bahamas';

  const [formData, setFormData] = useState({
    id: '',
    receiptNumber: '',
    customer: '',
    description: '',
    packageCount: 1,
    packageType: 'Cartons',
    lengthInches: 24,
    widthInches: 20,
    heightInches: 18,
    weightLbs: 120,
    destinationPort: defaultPort,
    status: 'Ready for Consolidation'
  });

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    if (cargo && isEdit) {
      setFormData({
        id: cargo.id || '',
        receiptNumber: cargo.receiptNumber || '',
        customer: cargo.customer || '',
        description: cargo.description || '',
        packageCount: cargo.packageCount || 1,
        packageType: cargo.packageType || 'Cartons',
        lengthInches: cargo.lengthInches || 24,
        widthInches: cargo.widthInches || 20,
        heightInches: cargo.heightInches || 18,
        weightLbs: cargo.weightLbs || 120,
        destinationPort: cargo.destinationPort || defaultPort,
        status: cargo.status || 'Ready for Consolidation'
      });
    } else {
      setFormData({
        id: `CRG-${Math.floor(1000 + Math.random() * 9000)}-01`,
        receiptNumber: `WR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        customer: '',
        description: '',
        packageCount: 1,
        packageType: 'Cartons',
        lengthInches: 24,
        widthInches: 20,
        heightInches: 18,
        weightLbs: 120,
        destinationPort: 'NAS - Nassau, Bahamas',
        status: 'Ready for Consolidation'
      });
    }
  }, [cargo, isEdit, isOpen]);

  if (!isOpen) return null;

  const pkg = Number(formData.packageCount) || 1;
  const l = Number(formData.lengthInches) || 0;
  const w = Number(formData.widthInches) || 0;
  const h = Number(formData.heightInches) || 0;
  const calculatedCft = Number(((l * w * h * pkg) / 1728).toFixed(2));
  const calculatedCbm = Number((calculatedCft * 0.0283168).toFixed(2));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      cft: calculatedCft,
      cbm: calculatedCbm
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Box size={20} style={{ color: '#0284C7' }} />
            <span>{isEdit ? `Edit Cargo Unit ${formData.id}` : 'Intake New Cargo Unit'}</span>
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
                <label className="form-label">Cargo Unit ID <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  disabled={isEdit}
                  className="form-control"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Warehouse Receipt Reference #</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Customer / Shipper Name <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Island Hardware Ltd"
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                />
              </div>

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
                      <option key={`crg-dest-${p.id || pCode}`} value={val}>
                        {pCode} — {p.name} ({p.island || p.country || 'Caribbean'})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description of Goods <span className="required">*</span></label>
              <textarea
                required
                className="form-control"
                rows={2}
                placeholder="Detailed commodity description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Package Count <span className="required">*</span></label>
                <input
                  type="number"
                  min="1"
                  required
                  className="form-control"
                  value={formData.packageCount}
                  onChange={(e) => setFormData({ ...formData, packageCount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Package Type</label>
                <select
                  className="form-select"
                  value={formData.packageType}
                  onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                >
                  <option value="Cartons">Cartons</option>
                  <option value="Boxes">Boxes</option>
                  <option value="Pallets">Pallets</option>
                  <option value="Crates">Crates</option>
                  <option value="Drums">Drums</option>
                  <option value="Skids">Skids</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Gross Weight (lbs) <span className="required">*</span></label>
                <input
                  type="number"
                  min="1"
                  required
                  className="form-control"
                  value={formData.weightLbs}
                  onChange={(e) => setFormData({ ...formData, weightLbs: e.target.value })}
                />
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Piece Dimensions (Inches)</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284C7' }}>
                  Total: {calculatedCbm} CBM ({calculatedCft} CFT)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B' }}>Length (in)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={formData.lengthInches}
                    onChange={(e) => setFormData({ ...formData, lengthInches: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B' }}>Width (in)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={formData.widthInches}
                    onChange={(e) => setFormData({ ...formData, widthInches: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B' }}>Height (in)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={formData.heightInches}
                    onChange={(e) => setFormData({ ...formData, heightInches: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Staging Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Ready for Consolidation">Ready for Consolidation</option>
                <option value="Consolidated">Consolidated</option>
                <option value="Staged at Dock">Staged at Dock</option>
                <option value="In Inspection">In Inspection</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              {isEdit ? <Save size={14} /> : <Plus size={14} />}
              <span>{isEdit ? 'Save Cargo Changes' : 'Register Cargo Unit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
