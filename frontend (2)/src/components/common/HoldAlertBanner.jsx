import React from 'react';
import { AlertOctagon, ShieldAlert, Lock, CheckCircle, PhoneCall, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const HoldAlertBanner = ({
  blNumber,
  holdDetails = {},
  onClearHoldClick,
  variant = 'warning' // 'warning' | 'danger'
}) => {
  const { isAgent, currentRole } = useAuth();
  const canClear = !isAgent && (currentRole === 'super_admin' || currentRole === 'documentation');

  return (
    <div className={`hold-banner no-print ${variant === 'danger' ? 'hold-banner-danger' : ''}`}>
      <div className="hold-banner-icon">
        <ShieldAlert size={22} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
          <div className="hold-banner-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Lock size={16} />
            <span>BILL OF LADING ON HOLD — {blNumber}</span>
          </div>

          {canClear && onClearHoldClick && (
            <button
              onClick={onClearHoldClick}
              className="btn btn-sm btn-success"
              style={{ fontWeight: 700 }}
            >
              <CheckCircle size={14} />
              <span>Authorize &amp; Clear Hold</span>
            </button>
          )}
        </div>

        <div className="hold-banner-desc" style={{ marginBottom: '0.5rem' }}>
          <strong>Reason:</strong> {holdDetails.reason || 'Administrative Review & Payment Verification Required'}
        </div>

        {holdDetails.holdNotes && (
          <div style={{ fontSize: '0.8rem', color: '#475569', background: 'rgba(255, 255, 255, 0.65)', padding: '0.4rem 0.6rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
            <strong>Notes:</strong> {holdDetails.holdNotes}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: '#64748B' }}>
          {holdDetails.placedBy && <span>Placed by: <strong>{holdDetails.placedBy}</strong></span>}
          {holdDetails.placedAt && <span>Timestamp: <strong>{holdDetails.placedAt}</strong></span>}
          {isAgent && (
            <span style={{ color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} /> Document downloads &amp; cargo release locked. Contact Head Office for clearance.
            </span>
          )}
        </div>

        {isAgent && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(220, 38, 38, 0.25)', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: '#334155' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <PhoneCall size={12} style={{ color: '#0284C7' }} /> Head Office Hotline: <strong>+1 (305) 555-5377 (Ext 4)</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={12} style={{ color: '#0284C7' }} /> Documentation: <strong>documentation@vicustoms.com</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
