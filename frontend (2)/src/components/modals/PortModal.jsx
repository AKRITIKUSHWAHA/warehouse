import React, { useState, useEffect, useMemo } from 'react';
import { Anchor, X, Save, Plus, MapPin } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';

export const PortModal = ({
  isOpen,
  onClose,
  onSave,
  port = null,
  isEdit = false
}) => {
  const { users = [], agents = [] } = useAppData();
  const { usersList = [] } = useAuth();

  const agentUsers = useMemo(() => {
    const map = new Map();
    [...usersList, ...users].forEach((u) => {
      if (u && (u.name || u.email)) {
        const isAgent =
          u.roleKey === 'agent' ||
          u.role === 'Destination Agent' ||
          u.role?.toLowerCase()?.includes('agent');
        if (isAgent) {
          const key = (u.name || u.email).trim().toLowerCase();
          if (!map.has(key)) {
            map.set(key, u);
          }
        }
      }
    });
    return Array.from(map.values());
  }, [usersList, users]);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    island: '',
    country: 'Bahamas',
    defaultAgent: '',
    status: 'Active'
  });

  useEffect(() => {
    if (port && isEdit) {
      setFormData({
        code: port.code || port.portCode || '',
        name: port.name || '',
        island: port.island || '',
        country: port.country || 'Bahamas',
        defaultAgent: port.defaultAgent || '',
        status: port.status || 'Active'
      });
    } else {
      setFormData({
        code: '',
        name: '',
        island: '',
        country: 'Bahamas',
        defaultAgent: '',
        status: 'Active'
      });
    }
  }, [port, isEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      code: formData.code.toUpperCase().trim()
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: '#E0F2FE', color: '#0284C7', padding: '0.4rem', borderRadius: '6px' }}>
              <Anchor size={20} />
            </div>
            <div>
              <div className="modal-title">{isEdit ? `Edit Island Port (${formData.code || port?.portCode || ''})` : 'Add New Island Port Destination'}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Define island cargo discharge terminal and port code
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Port Code (3-4 Letters) <span className="required">*</span></label>
                <input
                  type="text"
                  maxLength={5}
                  required
                  placeholder="e.g. NAS, MHH, PLS"
                  className="form-control"
                  style={{ textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Island / Region <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abaco, Exuma, Grand Bahama"
                  className="form-control"
                  value={formData.island}
                  onChange={(e) => setFormData({ ...formData, island: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Port Terminal Name <span className="required">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Marsh Harbour Freight Terminal"
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Country / Territory</label>
                <select
                  className="form-select"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                >
                  <option value="Bahamas">Bahamas</option>
                  <option value="Turks & Caicos">Turks & Caicos</option>
                  <option value="Cayman Islands">Cayman Islands</option>
                  <option value="Jamaica">Jamaica</option>
                  <option value="Barbados">Barbados</option>
                  <option value="Trinidad & Tobago">Trinidad & Tobago</option>
                  <option value="United States">United States</option>
                  <option value="Other Caribbean">Other Caribbean</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Default Assigned Port Agent</label>
                <select
                  className="form-select"
                  value={formData.defaultAgent}
                  onChange={(e) => setFormData({ ...formData, defaultAgent: e.target.value })}
                >
                  <option value="">-- Select Assigned Port Agent --</option>
                  {(() => {
                    const list = agentUsers.map((u) => ({
                      value: u.name,
                      label: `${u.name} (Destination Agent)`
                    }));
                    if (formData.defaultAgent && !list.some((item) => item.value === formData.defaultAgent)) {
                      list.unshift({
                        value: formData.defaultAgent,
                        label: formData.defaultAgent
                      });
                    }
                    return list.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Operational Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active Port Destination</option>
                <option value="Seasonal">Seasonal Service</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              <Save size={14} />
              <span>{isEdit ? 'Save Port Changes' : 'Add Port Destination'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
