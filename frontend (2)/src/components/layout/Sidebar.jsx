import React from 'react';
import { BrandLogo } from '../common/BrandLogo';
import {
  LayoutDashboard,
  Package,
  Layers,
  Ship,
  FileText,
  FileSpreadsheet,
  Box,
  Search,
  FileStack,
  Users,
  ShieldCheck,
  History,
  Activity,
  Settings,
  ChevronRight,
  ExternalLink,
  LogOut,
  Shield,
  Building2,
  Printer,
  Anchor,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ activeTab, onSelectTab, isOpen, onClose, isCollapsed = false }) => {
  const { currentUser, isAgent, switchUser, logout, usersList, isMenuAllowed } = useAuth();

  const roleKey = currentUser?.roleKey || 'super_admin';

  // Build dynamic role-filtered navigation menu strictly aligned with Super Admin matrix permissions
  const getNavSections = () => {
    const rawSections = [
      {
        id: 'cargo-intake',
        title: (isAgent || roleKey === 'agent') ? 'AGENT PORT OPERATIONS' : '3-STEP CARGO WORKFLOW',
        items: [
          {
            id: (isAgent || roleKey === 'agent') ? 'agent-dashboard' : 'dashboard',
            label: (isAgent || roleKey === 'agent') ? 'Agent Dashboard' : roleKey === 'documentation' ? 'Documentation Desk' : roleKey === 'operations' ? 'Operations Overview' : 'Overview Dashboard',
            icon: LayoutDashboard,
            moduleId: 'dashboard'
          },
          { id: 'warehouse-receipts', label: '1. Warehouse Receipts', icon: Package, moduleId: 'warehouse-receipts' },
          { id: 'house-bills', label: '2. House Bills of Lading', icon: FileText, moduleId: 'house-bills' },
          {
            id: 'bills-of-lading',
            label: '3. Master Bills & Manifests',
            icon: FileText,
            moduleId: 'bills-of-lading'
          }
        ]
      },
      {
        id: 'system-governance',
        title: 'SYSTEM & SETTINGS',
        items: [
          { id: 'users', label: 'Users & Roles', icon: ShieldCheck, moduleId: 'users' },
          { id: 'settings', label: 'System Settings', icon: Settings, moduleId: 'settings' }
        ]
      }
    ];

    return rawSections
      .map(sec => ({
        ...sec,
        items: sec.items.filter(item => {
          if (item.moduleId === 'shipments') return true;
          return isMenuAllowed(roleKey, item.moduleId || item.id);
        })
      }))
      .filter(sec => sec.items.length > 0);
  };

  const navSections = getNavSections();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop no-print"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar no-print ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
        style={{
          color: '#FFFFFF'
        }}
      >
        {/* Sidebar Header */}
        <div style={{ padding: '1.25rem 1.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <BrandLogo variant="light" size="default" />
            <button
              onClick={onClose}
              className="show-mobile-only btn btn-ghost btn-icon"
              style={{ color: '#94A3B8', padding: '4px' }}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          </div>
          <div style={{
            marginTop: '0.65rem',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            color: '#38BDF8',
            padding: '0.25rem 0.6rem',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>ROLE: {currentUser?.role?.toUpperCase()}</span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
          </div>
        </div>

        {/* Navigation List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {navSections.map((sec, secIdx) => (
            <div key={secIdx}>
              {sec.title && (
                <div style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#64748B',
                  padding: '0.35rem 0.75rem 0.25rem',
                  textTransform: 'uppercase'
                }}>
                  {sec.title}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (item.moduleId === 'shipments' && (activeTab === 'shipments' || activeTab === 'agent-shipments'));
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (onClose) onClose();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        backgroundColor: isActive ? '#173B6C' : 'transparent',
                        color: isActive ? '#FFFFFF' : '#94A3B8',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.825rem',
                        transition: 'all 150ms ease',
                        textAlign: 'left',
                        width: '100%',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.color = '#FFFFFF';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#94A3B8';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <Icon size={17} style={{ color: isActive ? '#38BDF8' : '#94A3B8', flexShrink: 0 }} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight size={14} style={{ color: '#38BDF8' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer: Logged in User Profile & Logout */}
        <div style={{ padding: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#061121', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#0284C7',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.75rem',
              flexShrink: 0
            }}>
              {currentUser?.avatar || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.name || 'Staff User'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.email}
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '0.63rem',
                fontWeight: 600,
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38BDF8',
                marginTop: '3px',
                width: 'fit-content'
              }}>
                {currentUser?.role || (currentUser?.roleKey === 'super_admin' ? 'Super Admin' : currentUser?.roleKey === 'warehouse' ? 'Warehouse Staff' : currentUser?.roleKey === 'documentation' ? 'Documentation Staff' : currentUser?.roleKey === 'operations' ? 'Operations Coordinator' : currentUser?.roleKey === 'agent' ? 'Destination Agent' : 'Staff')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex' }}>
            <button
              onClick={logout}
              className="btn btn-sm btn-outline w-full"
              style={{ fontSize: '0.75rem', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.4)', padding: '0.35rem 0.6rem', justifyContent: 'center' }}
              title="Sign Out to Login Page"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
