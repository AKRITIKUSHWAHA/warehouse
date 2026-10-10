import React, { useState, useEffect } from 'react';
import { BrandLogo } from '../components/common/BrandLogo';
import {
  LayoutDashboard,
  Ship,
  FileStack,
  Search,
  LogOut,
  Menu,
  Shield,
  HelpCircle,
  PhoneCall,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Layers,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { QuickSearchModal } from '../components/modals/QuickSearchModal';

export const AgentLayout = ({
  activeTab,
  onSelectTab,
  onNavigateDetail,
  children
}) => {
  const { currentUser, switchUser, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      setMobileDrawerOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  const agentTabs = [
    { id: 'agent-dashboard', label: 'Agent Dashboard', icon: LayoutDashboard },
    { id: 'agent-shipments', label: 'My Assigned Shipments', icon: Ship },
    { id: 'my-consolidations', label: 'My Consolidations', icon: Layers },
    { id: 'agent-documents', label: 'Documents & B/Ls', icon: FileStack },
    { id: 'agent-tracking', label: 'Cargo Tracking', icon: Search }
  ];

  return (
    <div className="app-container">
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="sidebar-backdrop no-print"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Agent Sidebar */}
      <aside
        className={`sidebar no-print ${mobileDrawerOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}
        style={{
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          borderRight: sidebarCollapsed ? 'none' : '1px solid #334155'
        }}
      >
        {/* Agent Header Branding */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <BrandLogo variant="light" size="default" />
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="show-mobile-only btn btn-ghost btn-icon"
              style={{ color: '#94A3B8', padding: '4px' }}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          </div>
          <div style={{
            marginTop: '0.65rem',
            background: 'rgba(217, 119, 6, 0.15)',
            border: '1px solid #D97706',
            color: '#FBBF24',
            padding: '0.35rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Shield size={13} />
            <span>SECURE AGENT PORTAL</span>
          </div>
        </div>

        {/* Agent Identity Box */}
        <div style={{ padding: '0.85rem 1.25rem', background: '#061121', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
            AUTHENTICATED AGENT
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#FFFFFF', marginTop: '2px' }}>
            Caribbean Express Freight Ltd.
          </div>
          <div style={{ fontSize: '0.72rem', color: '#38BDF8' }}>
            Territory: Nassau &amp; Freeport (Bahamas)
          </div>
        </div>

        {/* Navigation Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {agentTabs.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileDrawerOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: isActive ? '#D97706' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#CBD5E1',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  transition: 'all 150ms ease',
                  textAlign: 'left',
                  width: '100%',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Icon size={17} style={{ color: isActive ? '#FFFFFF' : '#94A3B8', flexShrink: 0 }} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight size={14} style={{ color: '#FFFFFF' }} />}
              </button>
            );
          })}
        </div>

        {/* Agent Support & Exit */}
        <div style={{ padding: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#061121', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <PhoneCall size={12} style={{ color: '#38BDF8' }} /> Head Office: +1 (305) 555-5377
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              onClick={() => {
                switchUser('USR-001'); // Return to super admin
                onSelectTab('dashboard');
              }}
              className="btn btn-sm btn-outline"
              style={{ flex: 1, fontSize: '0.7rem', color: '#38BDF8', borderColor: '#334155', justifyContent: 'center', gap: '4px', padding: '0.35rem' }}
            >
              <ExternalLink size={12} />
              <span>Staff Console</span>
            </button>

            <button
              onClick={logout}
              className="btn btn-sm btn-outline"
              style={{ fontSize: '0.7rem', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.4)', padding: '0.35rem 0.6rem', justifyContent: 'center', gap: '4px' }}
            >
              <LogOut size={12} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="top-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
            <button
              onClick={handleToggleSidebar}
              className="btn btn-ghost btn-icon"
              aria-label="Toggle agent navigation"
              style={{ flexShrink: 0 }}
            >
              <Menu size={20} />
            </button>
            <div className="show-mobile-only" style={{ flexShrink: 0, cursor: 'pointer' }} onClick={() => onSelectTab('agent-dashboard')}>
              <BrandLogo variant="dark" size="small" showSubtitle={false} />
            </div>
            <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0A192F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Agent Portal — Caribbean Express Freight Ltd.
              </span>
              <span style={{ fontSize: '0.7rem', background: '#D97706', color: '#FFFFFF', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, flexShrink: 0 }}>
                NASSAU HUB
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => {
                switchUser('USR-001');
                onSelectTab('dashboard');
              }}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', color: '#0284C7' }}
            >
              <ExternalLink size={13} />
              <span className="hide-mobile">HQ Staff Console</span>
            </button>

            <button
              onClick={logout}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', color: '#EF4444', borderColor: '#FECACA', background: '#FEF2F2' }}
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        <main className="main-content" id="main-content-scroll">
          {children}
        </main>
      </div>

      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={(type, id) => {
          if (type === 'shipments') {
            onSelectTab('agent-shipments');
            if (onNavigateDetail) onNavigateDetail('agent-shipments', id);
          }
        }}
      />
    </div>
  );
};
