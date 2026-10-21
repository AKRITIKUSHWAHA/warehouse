import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Check } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const HouseBillModal = ({
  isOpen,
  onClose,
  hbl = null,
  onSave
}) => {
  const { customers = [] } = useAppData();
  const hasInitializedRef = useRef(false);
  const [formData, setFormData] = useState({
    cargoDescription: '',
    freightTerms: 'Freight Prepaid',
    status: 'Active',
    notes: '',
    shipperId: '',
    shipperName: '',
    shipperAddress: '',
    consigneeId: '',
    consigneeName: '',
    consigneeAddress: '',
    rateBasis: 'cft',
    oceanFreightRate: 3.50,
    docFee: 50.00,
    terminalHandlingFee: 35.00,
    customsFee: 25.00
  });

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    if (hbl) {
      setFormData({
        cargoDescription: hbl.cargoDescription || '',
        freightTerms: hbl.freightTerms || 'Freight Prepaid',
        status: hbl.status || 'Active',
        notes: hbl.notes || '',
        shipperId: hbl.shipperId || (typeof hbl.shipper === 'object' ? hbl.shipper?.id : '') || '',
        shipperName: typeof hbl.shipper === 'object' ? hbl.shipper.name : hbl.shipper || '',
        shipperAddress: typeof hbl.shipper === 'object' ? hbl.shipper.address : '',
        consigneeId: hbl.consigneeId || (typeof hbl.consignee === 'object' ? hbl.consignee?.id : '') || '',
        consigneeName: typeof hbl.consignee === 'object' ? hbl.consignee.name : hbl.consignee || '',
        consigneeAddress: typeof hbl.consignee === 'object' ? hbl.consignee.address : '',
        rateBasis: hbl.freightCharges?.rateBasis || 'cft',
        oceanFreightRate: hbl.freightCharges?.rate !== undefined ? hbl.freightCharges.rate : 3.50,
        docFee: hbl.freightCharges?.documentationFee !== undefined ? hbl.freightCharges.documentationFee : 50.00,
        terminalHandlingFee: hbl.freightCharges?.terminalHandlingFee !== undefined ? hbl.freightCharges.terminalHandlingFee : 35.00,
        customsFee: hbl.freightCharges?.customsFee !== undefined ? hbl.freightCharges.customsFee : 25.00
      });
    }
  }, [hbl, isOpen]);

  if (!isOpen) return null;

  // Calculate live ocean freight and total
  const rate = Number(formData.oceanFreightRate) || 0;
  let oceanCharge = 0;
  if (formData.rateBasis === 'cft') {
    oceanCharge = (Number(hbl?.totalCft) || 0) * rate;
  } else if (formData.rateBasis === 'cbm') {
    oceanCharge = (Number(hbl?.totalCbm) || 0) * rate;
  } else if (formData.rateBasis === 'weight') {
    oceanCharge = ((Number(hbl?.totalWeightLbs) || 0) / 100) * rate;
  } else {
    oceanCharge = rate;
  }
  oceanCharge = Number(oceanCharge.toFixed(2));
  const docFee = Number(formData.docFee) || 0;
  const terminalFee = Number(formData.terminalHandlingFee) || 0;
  const customsFee = Number(formData.customsFee) || 0;
  const totalAmount = Number((oceanCharge + docFee + terminalFee + customsFee).toFixed(2));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...hbl,
      cargoDescription: formData.cargoDescription,
      freightTerms: formData.freightTerms,
      status: formData.status,
      notes: formData.notes,
      shipperId: formData.shipperId || undefined,
      consigneeId: formData.consigneeId || undefined,
      shipper: {
        id: formData.shipperId || undefined,
        name: formData.shipperName,
        address: formData.shipperAddress
      },
      consignee: {
        id: formData.consigneeId || undefined,
        name: formData.consigneeName,
        address: formData.consigneeAddress
      },
      freightCharges: {
        rateBasis: formData.rateBasis,
        rate: Number(formData.oceanFreightRate),
        oceanFreightAmount: oceanCharge,
        documentationFee: docFee,
        terminalHandlingFee: terminalFee,
        customsFee: customsFee,
        totalAmount: totalAmount,
        currency: 'USD'
      }
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileText size={20} style={{ color: '#2563EB' }} />
            <div>
              <div className="modal-title">Edit House Bill of Lading {hbl?.hblNumber}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Customer: {hbl?.customerName} ({hbl?.destinationPort})
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
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
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="form-group">
              <label className="form-label">Cargo Description</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={formData.cargoDescription}
                onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Shipper Name</label>
                  <select
                    style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', maxWidth: '170px' }}
                    defaultValue=""
                    onChange={(e) => {
                      const c = customers.find(cust => cust.id === e.target.value);
                      if (c) {
                        setFormData(prev => ({
                          ...prev,
                          shipperId: c.id,
                          shipperName: c.name,
                          shipperAddress: c.address || prev.shipperAddress
                        }));
                      }
                    }}
                  >
                    <option value="" disabled>From Customers...</option>
                    {customers.map(c => (
                      <option key={`hb-m-shipper-${c.id}`} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  className="form-control"
                  value={formData.shipperName}
                  onChange={(e) => setFormData({ ...formData, shipperName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Consignee Name</label>
                  <select
                    style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', maxWidth: '170px' }}
                    defaultValue=""
                    onChange={(e) => {
                      const c = customers.find(cust => cust.id === e.target.value);
                      if (c) {
                        setFormData(prev => ({
                          ...prev,
                          consigneeId: c.id,
                          consigneeName: c.name,
                          consigneeAddress: c.address || prev.consigneeAddress
                        }));
                      }
                    }}
                  >
                    <option value="" disabled>From Customers...</option>
                    {customers.map(c => (
                      <option key={`hb-m-consignee-${c.id}`} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  className="form-control"
                  value={formData.consigneeName}
                  onChange={(e) => setFormData({ ...formData, consigneeName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Freight Payment Terms</label>
                <select
                  className="form-select"
                  value={formData.freightTerms}
                  onChange={(e) => setFormData({ ...formData, freightTerms: e.target.value })}
                >
                  <option value="Freight Prepaid">Freight Prepaid</option>
                  <option value="Freight Collect">Freight Collect</option>
                  <option value="Third Party Billing">Third Party Billing</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">HBL Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Consolidated">Consolidated</option>
                  <option value="Released">Released</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Freight Rates & Rating Section */}
            <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0A192F' }}>Freight Rating &amp; Charges Breakdown</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#16A34A', fontFamily: 'JetBrains Mono, monospace' }}>
                  Total: ${totalAmount.toFixed(2)} USD
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3" style={{ marginBottom: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '2px' }}>Rate Basis</label>
                  <select
                    className="form-select"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                    value={formData.rateBasis}
                    onChange={(e) => setFormData({ ...formData, rateBasis: e.target.value })}
                  >
                    <option value="cft">Per CFT ($/CFT)</option>
                    <option value="cbm">Per CBM ($/CBM)</option>
                    <option value="weight">Per 100 LBS ($/CWT)</option>
                    <option value="flat">Flat Ocean Rate</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '2px' }}>Ocean Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                    value={formData.oceanFreightRate}
                    onChange={(e) => setFormData({ ...formData, oceanFreightRate: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '2px' }}>Ocean Freight</label>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0A192F', padding: '0.35rem 0' }}>
                    ${oceanCharge.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '2px' }}>Doc Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                    value={formData.docFee}
                    onChange={(e) => setFormData({ ...formData, docFee: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '2px' }}>Terminal Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                    value={formData.terminalHandlingFee}
                    onChange={(e) => setFormData({ ...formData, terminalHandlingFee: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '2px' }}>Customs Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                    value={formData.customsFee}
                    onChange={(e) => setFormData({ ...formData, customsFee: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Special Notes &amp; Customs Instructions</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              <Check size={15} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
