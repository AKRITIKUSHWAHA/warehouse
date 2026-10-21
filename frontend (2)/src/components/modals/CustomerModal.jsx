import React, { useState, useEffect } from 'react';
import { X, Building2, User, Phone, Mail, MapPin, Check } from 'lucide-react';

export const CustomerModal = ({ isOpen, onClose, customer, isEdit = false, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    contactPerson: '',
    email: '',
    telephone: '',
    address: '',
    taxId: '',
    accountType: 'Customer',
    creditTerms: 'Net 30',
    notes: '',
    status: 'Active',
    destinationPort: '',
    destinationCode: ''
  });

  useEffect(() => {
    if (customer && isEdit) {
      setFormData({
        name: customer.name || customer.companyName || '',
        companyName: customer.companyName || customer.name || '',
        contactPerson: customer.contactPerson || '',
        email: customer.email || '',
        telephone: customer.telephone || customer.phone || '',
        address: customer.address || '',
        taxId: customer.taxId || '',
        accountType: 'Customer',
        creditTerms: customer.creditTerms || 'Net 30',
        notes: customer.notes || '',
        status: customer.status || 'Active',
        destinationPort: customer.destinationPort || '',
        destinationCode: customer.destinationCode || '',
      });
    } else {
      setFormData({
        name: '',
        companyName: '',
        contactPerson: '',
        email: '',
        telephone: '',
        address: '',
        taxId: '',
        accountType: 'Customer',
        creditTerms: 'Net 30',
        notes: '',
        status: 'Active',
        destinationPort: '',
        destinationCode: '',
      });
    }
  }, [customer, isEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      companyName: formData.name,
      accountType: 'Customer',
      destinationPort: formData.destinationPort || customer?.destinationPort || '',
      destinationCode: formData.destinationCode || customer?.destinationCode || '',
    };
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('Failed to save customer profile:', err);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-dialog modal-md" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: '#EFF6FF', color: '#0284C7', padding: '0.4rem', borderRadius: '6px' }}>
              <Building2 size={20} />
            </div>
            <div>
              <div className="modal-title">{isEdit ? 'Edit Customer Profile' : 'New Customer Registration'}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                {isEdit ? `Update profile for ${customer?.name}` : 'Register a customer (Shipper or Consignee)'}
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
              <label className="form-label">Company / Customer Name <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. St. Thomas Grocery Distributors"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, companyName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Marcus Vance"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Telephone / WhatsApp</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. +1 (340) 555-0144"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. orders@stthomasgrocery.vi"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tax ID / TIN / VAT # (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. TIN-VI-994821"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Delivery Address / Headquarters <span className="required">*</span></label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="e.g. Veterans Drive, Suite 300, Charlotte Amalie, St. Thomas"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Client Notes &amp; Customs Instructions (Optional)</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="e.g. Requires security seal, palletized delivery, or specific receiving hours."
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
              <span>{isEdit ? 'Save Changes' : 'Save Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

