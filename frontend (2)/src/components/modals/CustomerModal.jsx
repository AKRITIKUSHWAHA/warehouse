import React, { useState, useEffect } from 'react';
import { X, Building2, User, Phone, Mail, MapPin, Anchor, FileText, Check } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const CustomerModal = ({ isOpen, onClose, customer, isEdit = false, onSave }) => {
  const { ports = [] } = useAppData();
  const nasPort = (ports || []).find(p => (p.code || p.portCode) === 'NAS');
  const defaultPort = nasPort
    ? `${nasPort.code || nasPort.portCode} - ${nasPort.name}`
    : (ports[0] ? `${ports[0].code || ports[0].portCode} - ${ports[0].name}` : 'NAS - Nassau Container Port');

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    contactPerson: '',
    email: '',
    telephone: '',
    address: '',
    taxId: '',
    accountType: 'Commercial Importer',
    creditTerms: 'Net 30',
    notes: '',
    status: 'Active'
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
        accountType: customer.accountType || 'Commercial Importer',
        creditTerms: customer.creditTerms || 'Net 30',
        notes: customer.notes || '',
        status: customer.status || 'Active',
        destinationPort: customer.destinationPort || defaultPort,
        destinationCode: customer.destinationCode || (customer.destinationPort ? customer.destinationPort.split(' - ')[0] : 'NAS'),
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
        accountType: 'Commercial Importer',
        creditTerms: 'Net 30',
        notes: '',
        status: 'Active',
        destinationPort: defaultPort,
        destinationCode: defaultPort ? defaultPort.split(' - ')[0] : 'NAS',
      });
    }
  }, [customer, isEdit, isOpen, defaultPort]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      companyName: formData.name,
      destinationPort: formData.destinationPort || customer?.destinationPort || defaultPort,
      destinationCode: formData.destinationCode || customer?.destinationCode || (defaultPort ? defaultPort.split(' - ')[0] : 'NAS'),
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
                {isEdit ? `Update profile for ${customer?.name}` : 'Register a commercial or retail shipping client'}
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
                placeholder="e.g. Atlantic Trading Co."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, companyName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Contact Person <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Marcus Vance"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Telephone / WhatsApp <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. +1 (242) 555-0144"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Email Address <span className="required">*</span></label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. orders@atlantictradingbahamas.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tax ID / TIN / VAT #</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. TIN-BS-994821"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Delivery Address / Destination Headquarters <span className="required">*</span></label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="e.g. Bay Street Commercial Centre, Suite 300, Nassau, Bahamas"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Party Role / Account Classification</label>
                <select
                  className="form-select"
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                >
                  <option value="Commercial Importer (Consignee)">Commercial Importer (Consignee)</option>
                  <option value="Supplier / Vendor (Shipper)">Supplier / Vendor (Shipper)</option>
                  <option value="Both Shipper &amp; Consignee">Both Shipper &amp; Consignee</option>
                  <option value="Wholesaler / Distributor">Wholesaler / Distributor</option>
                  <option value="Private Consignee">Private Consignee</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Default Destination Port / Hub</label>
                <select
                  className="form-select"
                  value={formData.destinationPort}
                  onChange={(e) => {
                    const val = e.target.value;
                    const code = val ? val.split(' - ')[0] : 'NAS';
                    setFormData({ ...formData, destinationPort: val, destinationCode: code });
                  }}
                >
                  {(ports && ports.length > 0 ? ports : [
                    { code: 'NAS', name: 'Nassau Container Port (Arawak Cay)' },
                    { code: 'FPO', name: 'Freeport Container Port' },
                    { code: 'KIN', name: 'Kingston Freeport Terminal (KFTL)' }
                  ]).map((p) => {
                    const portStr = `${p.code || p.portCode} - ${p.name}`;
                    return (
                      <option key={p.id || p.code || p.portCode} value={portStr}>
                        {portStr}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Client Notes &amp; Customs Instructions</label>
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
              <span>{isEdit ? 'Save Profile Changes' : 'Register Customer Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
