import React, { useState, useEffect } from 'react';
import { Users, X, Save, Plus } from 'lucide-react';

export const AgentModal = ({
  isOpen,
  onClose,
  onSave,
  agent = null,
  isEdit = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    agentCode: '',
    territory: 'St. Thomas & St. John, VI',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    creditLimitUsd: 50000,
    status: 'Active Agent'
  });

  useEffect(() => {
    if (agent && isEdit) {
      setFormData({
        name: agent.name || '',
        agentCode: agent.agentCode || '',
        territory: agent.territory || 'St. Thomas & St. John, VI',
        contactPerson: agent.contactPerson || '',
        email: agent.email || '',
        phone: agent.phone || '',
        address: agent.address || '',
        creditLimitUsd: agent.creditLimitUsd || 50000,
        status: agent.status || 'Active Agent'
      });
    } else {
      setFormData({
        name: '',
        agentCode: `AGT-CARIB-${Math.floor(10 + Math.random() * 90)}`,
        territory: 'St. Thomas & St. John, VI',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        creditLimitUsd: 50000,
        status: 'Active Agent'
      });
    }
  }, [agent, isEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      creditLimitUsd: Number(formData.creditLimitUsd) || 0
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Users size={20} style={{ color: '#0284C7' }} />
            <span>{isEdit ? `Edit Port Agent ${formData.name}` : 'Register New Destination Port Agent'}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '72vh', overflowY: 'auto' }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Agency / Company Name <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Caribbean Port Logistics Ltd"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Agent Code <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  disabled={isEdit}
                  className="form-control"
                  value={formData.agentCode}
                  onChange={(e) => setFormData({ ...formData, agentCode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Assigned Territory / Island <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. St. Thomas & St. John, VI"
                  value={formData.territory}
                  onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Primary Contact Person <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. David Vance"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Email Address <span className="required">*</span></label>
                <input
                  type="email"
                  required
                  className="form-control"
                  placeholder="e.g. operations@vi-agents.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telephone / Hotline <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. +1 (340) 774-8901"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Physical Harbour / Terminal Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Crown Bay Port Terminal, Suite 102, St. Thomas, VI"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Authorized Credit Limit (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className="form-control"
                  value={formData.creditLimitUsd}
                  onChange={(e) => setFormData({ ...formData, creditLimitUsd: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Agent Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active Agent">Active Agent</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Suspended">Suspended</option>
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
              <span>{isEdit ? 'Save Agent Changes' : 'Register Agent'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
