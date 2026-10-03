import React, { useState } from 'react';
import { BrandLogo } from '../common/BrandLogo';
import {
  Search,
  Plus,
  Bell,
  Menu,
  User,
  Shield,
  RotateCcw,
  Package,
  Layers,
  Ship,
  FileText,
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';

export const TopHeader = ({
  onToggleSidebar,
  onOpenSearch,
  onNavigate
}) => {
  const { currentUser, switchUser, logout, usersList, isAgent } = useAuth();
  const { resetDemoData, billsOfLading } = useAppData();
  const { showToast } = useToast();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const holdBLCount = (billsOfLading || []).filter(b => b.status === 'On Hold' || b.holdDetails?.isOnHold).length;

  return (
    <header className="top-header no-print">
      {/* Left: Hamburger, BrandLogo & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0, maxWidth: '540px' }}>
        <button
          onClick={onToggleSidebar}
          className="btn btn-ghost btn-icon"
          style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} style={{ color: '#0A192F' }} />
        </button>

        {/* Mobile Brand Logo (hidden on PC view where sidebar logo is present) */}
        <div className="show-mobile-only" style={{ flexShrink: 0, cursor: 'pointer' }} onClick={() => onNavigate('dashboard')}>
          <BrandLogo variant="dark" size="small" showSubtitle={false} />
        </div>

        {/* Desktop Global Search Bar */}
        <div
          onClick={onOpenSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '0.4rem 0.75rem',
            width: '100%',
            cursor: 'pointer',
            transition: 'border-color 150ms ease'
          }}
          className="search-bar-trigger hide-mobile"
        >
          <Search size={15} style={{ color: '#64748B', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', color: '#64748B', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Search Shipments, B/L, Receipts, Containers...
          </span>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            background: '#E2E8F0',
            color: '#475569',
            padding: '1px 5px',
            borderRadius: '4px',
            fontFamily: 'JetBrains Mono, monospace',
            flexShrink: 0
          }}>
            Ctrl+K
          </span>
        </div>
      </div>

      {/* Right: Actions, Notifications, User Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {/* Mobile Quick Search Button */}
        <button
          onClick={onOpenSearch}
          className="btn btn-ghost btn-icon show-mobile-only"
          title="Search Records (Ctrl+K)"
          aria-label="Search"
        >
          <Search size={18} style={{ color: '#0A192F' }} />
        </button>

        {/* Quick Action "Create New" Menu */}
        {!isAgent && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowCreateMenu(!showCreateMenu);
                setShowUserMenu(false);
                setShowNotifications(false);
              }}
              className="btn btn-primary btn-sm"
              style={{ gap: '4px', padding: '0.35rem 0.65rem' }}
              title="Quick Create Action"
            >
              <Plus size={15} />
              <span className="hide-mobile">Quick Action</span>
              <ChevronDown size={13} className="hide-mobile" />
            </button>

            {showCreateMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.4rem',
                  width: '240px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  zIndex: 100,
                  overflow: 'hidden',
                  padding: '0.35rem'
                }}
              >
                <div
                  onClick={() => { onNavigate('warehouse-receipts', 'create'); setShowCreateMenu(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.55rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.825rem' }}
                  className="card-hover"
                >
                  <Package size={16} style={{ color: '#0284C7' }} />
                  <span>New Warehouse Receipt</span>
                </div>
                <div
                  onClick={() => { onNavigate('consolidations', 'create'); setShowCreateMenu(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.55rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.825rem' }}
                  className="card-hover"
                >
                  <Layers size={16} style={{ color: '#D97706' }} />
                  <span>Build Cargo Consolidation</span>
                </div>
                <div
                  onClick={() => { onNavigate('shipments', 'create'); setShowCreateMenu(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.55rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.825rem' }}
                  className="card-hover"
                >
                  <Ship size={16} style={{ color: '#10B981' }} />
                  <span>New Master Shipment</span>
                </div>
                <div
                  onClick={() => { onNavigate('bills-of-lading', 'create'); setShowCreateMenu(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.55rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.825rem' }}
                  className="card-hover"
                >
                  <FileText size={16} style={{ color: '#8B5CF6' }} />
                  <span>Create Bill of Lading (B/L)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
              setShowCreateMenu(false);
            }}
            className="btn btn-ghost btn-icon"
            style={{ position: 'relative' }}
            aria-label="Notifications"
          >
            <Bell size={19} style={{ color: '#475569' }} />
            {holdBLCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#EF4444'
              }} />
            )}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.4rem',
                width: 'min(320px, 88vw)',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                zIndex: 100,
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E2E8F0', fontWeight: 700, fontSize: '0.85rem', color: '#0A192F', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Operational Alerts</span>
                <span style={{ fontSize: '0.7rem', background: '#FEF3C7', color: '#B45309', padding: '1px 6px', borderRadius: '4px' }}>
                  {holdBLCount} Hold Notices
                </span>
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <div
                  onClick={() => { onNavigate('bills-of-lading', 'BL-VI-2026-0092'); setShowNotifications(false); }}
                  style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #F1F5F9', background: '#FFFBEB', cursor: 'pointer' }}
                  className="card-hover"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.8rem', color: '#B45309' }}>
                    <AlertTriangle size={14} /> B/L BL-VI-2026-0092 On Hold
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#78350F', marginTop: '2px' }}>
                    Awaiting Wire Transfer payment for Nassau Consolidated Cargo.
                  </div>
                </div>

                <div
                  onClick={() => { onNavigate('manifests', 'MNF-2026-0441'); setShowNotifications(false); }}
                  style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}
                  className="card-hover"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.8rem', color: '#0A192F' }}>
                    <CheckCircle2 size={14} style={{ color: '#10B981' }} /> Manifest MNF-0441 Generated
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                    MV Caribbean Carrier (Voyage 2026-18W) manifest ready for customs export.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Persona Switcher */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
              setShowCreateMenu(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.6rem',
              borderRadius: '8px',
              cursor: 'pointer',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC'
            }}
            className="card-hover"
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: isAgent ? '#D97706' : '#0A192F',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}
            >
              {currentUser?.avatar || 'U'}
            </div>

            <div className="hide-mobile" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0A192F' }}>
                {currentUser?.name}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                {currentUser?.role}
              </span>
            </div>

            <ChevronDown size={14} style={{ color: '#94A3B8' }} className="hide-mobile" />
          </div>

          {/* Role Switching Dropdown */}
          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.4rem',
                width: 'min(280px, 88vw)',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                zIndex: 100,
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  SWITCH DEMO USER PERSONA
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                  Experience role-specific views and permission restrictions:
                </div>
              </div>

              <div style={{ padding: '0.35rem' }}>
                {usersList.map(u => {
                  const isSelected = u.id === currentUser?.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setShowUserMenu(false);
                        if (u.roleKey === 'agent') {
                          onNavigate('agent-dashboard');
                        } else {
                          onNavigate('dashboard');
                        }
                        showToast(`Switched user to ${u.name} (${u.role}).`, 'info', 'Persona Switched');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: isSelected ? '#EFF6FF' : 'transparent'
                      }}
                      className="card-hover"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: u.roleKey === 'agent' ? '#D97706' : '#0A192F',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 700
                        }}>
                          {u.avatar}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#0A192F' }}>{u.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{u.role || u.roleKey}</div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 size={15} style={{ color: '#2563EB' }} />}
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', padding: '0.5rem 0.75rem', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <button
                  onClick={() => {
                    resetDemoData();
                    setShowUserMenu(false);
                  }}
                  className="btn btn-ghost btn-sm w-full"
                  style={{ fontSize: '0.75rem', color: '#64748B', justifyContent: 'center', gap: '4px' }}
                >
                  <RotateCcw size={12} />
                  <span>Reset All Demo Data</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="btn btn-outline btn-sm w-full"
                  style={{ fontSize: '0.75rem', color: '#EF4444', borderColor: '#FECACA', justifyContent: 'center', gap: '4px', background: '#FEF2F2' }}
                >
                  <LogOut size={13} />
                  <span>Sign Out / Switch Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
