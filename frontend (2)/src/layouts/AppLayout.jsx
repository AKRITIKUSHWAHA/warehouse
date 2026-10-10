import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { QuickSearchModal } from '../components/modals/QuickSearchModal';

export const AppLayout = ({
  activeTab,
  onSelectTab,
  onNavigateDetail,
  children
}) => {
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

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        isOpen={mobileDrawerOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <TopHeader
          onToggleSidebar={handleToggleSidebar}
          onOpenSearch={() => setIsSearchOpen(true)}
          onNavigate={(tab, id) => {
            onSelectTab(tab);
            if (id && onNavigateDetail) {
              onNavigateDetail(tab, id);
            }
          }}
        />

        <main className="main-content" id="main-content-scroll">
          {children}
        </main>
      </div>

      {/* Global Quick Search Modal (Ctrl+K) */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={(type, id) => {
          if (type === 'shipments') {
            onSelectTab('shipments');
            if (onNavigateDetail) onNavigateDetail('shipments', id);
          } else if (type === 'warehouse') {
            onSelectTab('warehouse-receipts');
            if (onNavigateDetail) onNavigateDetail('warehouse-receipts', id);
          } else if (type === 'bills') {
            onSelectTab('bills-of-lading');
            if (onNavigateDetail) onNavigateDetail('bills-of-lading', id);
          } else if (type === 'containers') {
            onSelectTab('containers');
          } else if (type === 'agents') {
            onSelectTab('agents');
          }
        }}
      />
    </div>
  );
};
