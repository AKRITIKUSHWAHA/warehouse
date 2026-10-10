import React, { useState, useEffect, useRef } from 'react';
import { Package, X, Save, Calculator } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const WarehouseReceiptModal = ({
  isOpen,
  onClose,
  onSave,
  receipt = null
}) => {
  const { ports, agents } = useAppData();
  const hasInitializedRef = useRef(false);

  const [formData, setFormData] = useState({
    customer: '',
    consignee: '',
    shipper: '',
    packageCount: 1,
    packageType: 'Cartons',
    cargoDescription: '',
    lengthInches: 24,
    widthInches: 20,
    heightInches: 18,
    weightLbs: 150,
    destinationCode: ports[0]?.code || 'NAS',
    destinationPort: ports[0] ? `${ports[0].code} - ${ports[0].name}` : 'NAS - Nassau, Bahamas',
    status: 'Ready for Consolidation',
    agentId: agents[0]?.id || null
  });

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    if (receipt) {
      setFormData({
        customer: receipt.customer || '',
        consignee: receipt.consignee || '',
        shipper: receipt.shipper || '',
        packageCount: receipt.packageCount || 1,
        packageType: receipt.packageType || 'Cartons',
        cargoDescription: receipt.cargoDescription || '',
        lengthInches: receipt.lengthInches || 24,
        widthInches: receipt.widthInches || 20,
        heightInches: receipt.heightInches || 18,
        weightLbs: receipt.weightLbs || 150,
        destinationCode: receipt.destinationCode || 'NAS',
        destinationPort: receipt.destinationPort || 'NAS - Nassau, Bahamas',
        status: receipt.status || 'Ready for Consolidation',
        agentId: receipt.agentId || (agents[0]?.id || null)
      });
    }
  }, [receipt, isOpen, agents]);

  if (!isOpen) return null;

  // Auto-calculated CFT & CBM
  const pkg = Number(formData.packageCount) || 1;
  const l = Number(formData.lengthInches) || 0;
  const w = Number(formData.widthInches) || 0;
  const h = Number(formData.heightInches) || 0;
  const calculatedCft = Number(((l * w * h * pkg) / 1728).toFixed(2));
  const calculatedCbm = Number((calculatedCft * 0.0283168).toFixed(2));

  const getPortCode = (p) => p?.portCode || p?.code || 'NAS';

  const handleSubmit = (e) => {
    e.preventDefault();
    const pkg = Number(formData.packageCount) || 1;
    const l = Number(formData.lengthInches) || 0;
    const w = Number(formData.widthInches) || 0;
    const h = Number(formData.heightInches) || 0;
    const calculatedCft = Number(((l * w * h * pkg) / 1728).toFixed(2));
    const calculatedCbm = Number((calculatedCft * 0.0283168).toFixed(2));
    const weightLbs = Number(formData.weightLbs) || 0;

    const updatedPackages = [
      {
        id: `PKG-${receipt?.receiptNumber || '01'}-01`,
        packageType: formData.packageType || 'Carton',
        description: formData.cargoDescription || 'General Cargo',
        lengthInches: l,
        widthInches: w,
        heightInches: h,
        weightLbs,
        pieces: pkg,
        cft: calculatedCft,
        cbm: calculatedCbm
      }
    ];

    onSave({
      ...formData,
      customerName: formData.customer || formData.shipper || formData.consignee || 'General Cargo',
      customer: formData.customer || formData.shipper || formData.consignee || 'General Cargo',
      consignee: formData.consignee,
      shipper: formData.shipper,
      cargoDescription: formData.cargoDescription,
      packageCount: pkg,
      totalPieces: pkg,
      packageType: formData.packageType,
      packages: updatedPackages,
      lengthInches: l,
      widthInches: w,
      heightInches: h,
      weightLbs,
      weightKg: Number((weightLbs * 0.453592).toFixed(1)),
      cft: calculatedCft,
      cbm: calculatedCbm,
      totalCft: calculatedCft,
      totalCbm: calculatedCbm,
      destinationPort: formData.destinationPort,
      destinationCode: formData.destinationCode,
      status: formData.status
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-dialog modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <Package size={20} style={{ color: '#D97706' }} />
            <span>Edit Warehouse Receipt {receipt?.receiptNumber}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
          >
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
                <label className="form-label">Shipper / Supplier Name</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Fulfillment, Supplier LLC"
                  className="form-control"
                  value={formData.shipper || formData.customer}
                  onChange={(e) => setFormData({ ...formData, shipper: e.target.value, customer: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Consignee / Destination Importer <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe, Island Imports Ltd"
                  className="form-control"
                  value={formData.consignee}
                  onChange={(e) => setFormData({ ...formData, consignee: e.target.value })}
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
                  <option value="Pallets / Skids">Pallets / Skids</option>
                  <option value="Crates">Crates</option>
                  <option value="Drums">Drums</option>
                  <option value="Bundles">Bundles</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Gross Weight (LBS) <span className="required">*</span></label>
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
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706' }}>
                  Live Volume: {calculatedCft} CFT <span style={{ color: '#0284C7', fontWeight: 600 }}>({calculatedCbm} CBM)</span>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Destination Port</label>
                <select
                  className="form-select"
                  value={formData.destinationPort}
                  onChange={(e) => {
                    const dest = e.target.value;
                    const code = dest.includes(' - ') ? dest.split(' - ')[0].trim() : dest;
                    setFormData({
                      ...formData,
                      destinationCode: code,
                      destinationPort: dest
                    });
                  }}
                >
                  {ports.map(p => {
                    const pCode = getPortCode(p);
                    return (
                      <option key={p.id || pCode} value={`${pCode} - ${p.name}`}>
                        {pCode} — {p.name} ({p.island || p.country})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Intake Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Ready for Consolidation">Ready for Consolidation</option>
                  <option value="Received">Received</option>
                  <option value="Consolidated">Consolidated</option>
                  <option value="On Hold">On Hold</option>
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
