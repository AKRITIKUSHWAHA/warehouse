import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Save, Plus, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const UserModal = ({
  isOpen,
  onClose,
  onSave,
  user = null,
  isEdit = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleKey: 'operations',
    role: 'Operations Coordinator',
    department: 'Operations & Freight Logistics',
    status: 'Active'
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const roles = [
    { key: 'super_admin', name: 'Super Admin', department: 'Executive Management & Administration' },
    { key: 'operations', name: 'Operations Coordinator', department: 'Operations & Freight Logistics' },
    { key: 'warehouse', name: 'Warehouse Staff', department: 'CFS Warehouse & Cargo Receiving' },
    { key: 'documentation', name: 'Documentation Specialist', department: 'Customs & Documentation' },
    { key: 'agent', name: 'Destination Port Agent', department: 'Caribbean Agent Network' }
  ];

  useEffect(() => {
    if (user && isEdit) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        roleKey: user.roleKey || 'operations',
        role: user.role || 'Operations Coordinator',
        department: user.department || 'Operations & Freight Logistics',
        status: user.status || 'Active'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        roleKey: 'operations',
        role: 'Operations Coordinator',
        department: 'Operations & Freight Logistics',
        status: 'Active'
      });
    }
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordError('');
  }, [user, isEdit, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRoleChange = (roleKey) => {
    const found = roles.find(r => r.key === roleKey);
    if (found) {
      setFormData({
        ...formData,
        roleKey: found.key,
        role: found.name,
        department: found.department
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!isEdit) {
      if (!password || password.trim().length === 0) {
        setPasswordError('Password is required.');
        return;
      }
      if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match. Please verify both fields.');
        return;
      }
    } else {
      if (password || confirmPassword) {
        if (!password) {
          setPasswordError('Please enter a new password or leave both password fields blank.');
          return;
        }
        if (password.length < 6) {
          setPasswordError('New password must be at least 6 characters long.');
          return;
        }
        if (password !== confirmPassword) {
          setPasswordError('New passwords do not match. Please verify both fields.');
          return;
        }
      }
    }

    const payload = {
      ...formData
    };

    if (password && password.trim().length > 0) {
      payload.password = password.trim();
    }

    onSave(payload);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        padding: 'clamp(0.5rem, 3vw, 1.25rem)'
      }}
    >
      <div
        className="modal-dialog"
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: 'min(92vh, 680px)',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-header"
          style={{
            padding: '1.1rem 1.5rem',
            borderBottom: '1px solid var(--border-color-light, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid #DBEAFE'
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                className="modal-title"
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--brand-navy-900, #0A192F)',
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {isEdit ? `Edit Staff Account (${formData.name || 'User'})` : 'Add New Staff User Account'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px', lineHeight: 1.3 }}>
                {isEdit ? 'Update credentials, password, and role permissions' : 'Set up credentials, password, role tier, and facility access'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease, color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F1F5F9';
              e.currentTarget.style.color = '#0F172A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748B';
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden'
          }}
        >
          <div
            className="modal-body"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            {/* Full Name & Email Address */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem'
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                  Full Name <span className="required" style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Alex Morgan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                  Email Address <span className="required" style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  className="form-control"
                  placeholder="e.g. alex.morgan@vicustoms.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem'
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>
                    {isEdit ? 'New Password' : 'Password'} {!isEdit && <span className="required" style={{ color: '#EF4444' }}>*</span>}
                  </span>
                  {isEdit && <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 400 }}>Optional</span>}
                </label>
                <div className="input-with-icon" style={{ position: 'relative' }}>
                  <Lock size={15} className="input-icon-left" style={{ color: '#94A3B8' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder={isEdit ? 'Leave blank to keep current' : 'Min. 6 characters'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    style={{ paddingLeft: '2.2rem', paddingRight: '2.5rem' }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '4px'
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                  Confirm {isEdit ? 'New Password' : 'Password'} {(!isEdit || password) && <span className="required" style={{ color: '#EF4444' }}>*</span>}
                </label>
                <div className="input-with-icon" style={{ position: 'relative' }}>
                  <Lock size={15} className="input-icon-left" style={{ color: '#94A3B8' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder={isEdit ? 'Confirm new password' : 'Re-enter password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    style={{ paddingLeft: '2.2rem', paddingRight: '2.5rem' }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '4px'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message Alert */}
            {passwordError && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '8px',
                  padding: '0.6rem 0.85rem',
                  fontSize: '0.78rem',
                  color: '#B91C1C',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Assigned Role */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                Assigned Role &amp; Permission Tier
              </label>
              <select
                className="form-select"
                value={formData.roleKey}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                {roles.map(r => (
                  <option key={r.key} value={r.key}>{r.name} ({r.department})</option>
                ))}
              </select>
            </div>

            {/* Department & Status */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem'
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                  Department / Facility
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Operations & Freight Logistics"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                  Account Status
                </label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          <div
            className="modal-footer"
            style={{
              padding: '0.875rem 1.5rem',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              background: '#F8FAFC',
              borderTop: '1px solid var(--border-color-light, #E2E8F0)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-sm"
              style={{ minWidth: '85px', justifyContent: 'center' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ minWidth: '130px', justifyContent: 'center' }}
            >
              {isEdit ? <Save size={14} /> : <Plus size={14} />}
              <span>{isEdit ? 'Save Changes' : 'Create User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
