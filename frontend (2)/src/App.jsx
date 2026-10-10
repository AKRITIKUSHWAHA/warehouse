import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { AppLayout } from './layouts/AppLayout';
import { AgentLayout } from './layouts/AgentLayout';
import { hasModulePermission } from './config/rolePermissions';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';

// Operational Pages
import { OperationsDashboard } from './pages/dashboard/OperationsDashboard';
import { CustomersList } from './pages/customers/CustomersList';
import { CustomerDetail } from './pages/customers/CustomerDetail';
import { WarehouseReceiptsList } from './pages/warehouse/WarehouseReceiptsList';
import { CreateWarehouseReceipt } from './pages/warehouse/CreateWarehouseReceipt';
import { WarehouseReceiptDetail } from './pages/warehouse/WarehouseReceiptDetail';
import { CargoList } from './pages/cargo/CargoList';
import { CargoDetail } from './pages/cargo/CargoDetail';
import { HouseBillsList } from './pages/house-bills/HouseBillsList';
import { CreateHouseBill } from './pages/house-bills/CreateHouseBill';
import { HouseBillDetail } from './pages/house-bills/HouseBillDetail';
import { ConsolidationsList } from './pages/consolidation/ConsolidationsList';
import { NewConsolidationWizard } from './pages/consolidation/NewConsolidationWizard';
import { ShipmentsList } from './pages/shipments/ShipmentsList';
import { ShipmentDetail } from './pages/shipments/ShipmentDetail';
import { CreateShipment } from './pages/shipments/CreateShipment';
import { BillsOfLadingList } from './pages/bills/BillsOfLadingList';
import { BillOfLadingDetail } from './pages/bills/BillOfLadingDetail';
import { ManifestsList } from './pages/manifests/ManifestsList';
import { ManifestDetail } from './pages/manifests/ManifestDetail';
import { VesselsList } from './pages/shipping/VesselsList';
import { ContainersList } from './pages/shipping/ContainersList';
import { ShipmentTrackingPortal } from './pages/tracking/ShipmentTrackingPortal';
import { DocumentCenter } from './pages/documents/DocumentCenter';
import { AgentManagementList } from './pages/agents/AgentManagementList';
import { AgentDetail } from './pages/agents/AgentDetail';
import { AgentDashboard } from './pages/agent-portal/AgentDashboard';
import { AgentShipmentsList } from './pages/agent-portal/AgentShipmentsList';
import { AgentBLDetail } from './pages/agent-portal/AgentBLDetail';
import { AgentDocuments } from './pages/agent-portal/AgentDocuments';
import { UsersList } from './pages/users/UsersList';
import { AuditTrailList } from './pages/audit/AuditTrailList';
import { ShipmentHistoryArchive } from './pages/history/ShipmentHistoryArchive';
import { SettingsPage } from './pages/settings/SettingsPage';

// CSS Design System Imports
import './styles/variables.css';
import './styles/global.css';
import './styles/components.css';
import './styles/print.css';

const VALID_TABS = [
  'dashboard',
  'customers',
  'warehouse-receipts',
  'cargo',
  'house-bills',
  'consolidations',
  'shipments',
  'bills-of-lading',
  'manifests',
  'vessels',
  'containers',
  'tracking',
  'documents',
  'agents',
  'users',
  'audit',
  'history',
  'settings',
  'agent-dashboard',
  'agent-shipments',
  'agent-bl-detail',
  'agent-documents',
  'agent-tracking'
];

const parseUrlToRoute = (isAgent) => {
  if (typeof window === 'undefined') {
    return { tab: isAgent ? 'agent-dashboard' : 'dashboard', selectedRecordId: null, subAction: null };
  }

  let path = window.location.pathname || '';
  if (window.location.hash && window.location.hash.startsWith('#/')) {
    path = window.location.hash.slice(1);
  }

  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) {
    return {
      tab: isAgent ? 'agent-dashboard' : 'dashboard',
      selectedRecordId: null,
      subAction: null
    };
  }

  const [tab, second, ...rest] = segments;

  if (tab === 'login') {
    return { tab: isAgent ? 'agent-dashboard' : 'dashboard', selectedRecordId: null, subAction: null };
  }

  if (VALID_TABS.includes(tab)) {
    // Role protection: Agent cannot access internal staff operations tabs
    const agentAllowedTabs = [
      'agent-dashboard', 'agent-shipments', 'agent-bl-detail', 'agent-documents', 'agent-tracking',
      'shipments', 'consolidations', 'manifests', 'bills-of-lading', 'cargo', 'tracking',
      'warehouse-receipts', 'house-bills', 'customers'
    ];

    if (isAgent && !agentAllowedTabs.includes(tab)) {
      return { tab: 'agent-dashboard', selectedRecordId: null, subAction: null };
    }
    // Role protection: Staff/Super Admin cannot be trapped in agent portal tabs
    if (!isAgent && tab.startsWith('agent-')) {
      return { tab: 'dashboard', selectedRecordId: null, subAction: null };
    }

    if (second === 'create') {
      return { tab, selectedRecordId: null, subAction: 'create' };
    }
    if (second) {
      const recordId = decodeURIComponent([second, ...rest].join('/'));
      return { tab, selectedRecordId: recordId, subAction: 'detail' };
    }
    return { tab, selectedRecordId: null, subAction: null };
  }

  return {
    tab: isAgent ? 'agent-dashboard' : 'dashboard',
    selectedRecordId: null,
    subAction: null
  };
};

const getUrlForRoute = (tab, recordIdOrAction) => {
  if (!tab || tab === 'dashboard') return '/dashboard';
  if (recordIdOrAction === 'create') return `/${tab}/create`;
  if (recordIdOrAction) return `/${tab}/${encodeURIComponent(recordIdOrAction)}`;
  return `/${tab}`;
};

const MainAppRouter = () => {
  const { isAuthenticated, isAgent, currentUser } = useAuth();
  const { fetchMenuApi } = useAppData();

  const [routeState, setRouteState] = useState(() => parseUrlToRoute(isAgent));
  const { tab: activeTab, selectedRecordId, subAction } = routeState;

  // On activeTab change, trigger ONLY the clicked menu's API
  useEffect(() => {
    if (isAuthenticated && activeTab && fetchMenuApi) {
      fetchMenuApi(activeTab);
    }
  }, [isAuthenticated, activeTab, fetchMenuApi]);

  // Unified navigateTo function that updates state, browser URL, and history
  const navigateTo = useCallback((tab, recordIdOrAction = null, options = {}) => {
    const { replace = false, skipHistory = false } = options;
    let newAction = null;
    let newId = null;

    if (recordIdOrAction === 'create') {
      newAction = 'create';
    } else if (recordIdOrAction) {
      newId = recordIdOrAction;
      newAction = 'detail';
    }

    setRouteState({
      tab,
      selectedRecordId: newId,
      subAction: newAction
    });

    if (!skipHistory && typeof window !== 'undefined') {
      const newUrl = getUrlForRoute(tab, recordIdOrAction);
      if (window.location.pathname !== newUrl) {
        if (replace) {
          window.history.replaceState({ tab, recordIdOrAction }, '', newUrl);
        } else {
          window.history.pushState({ tab, recordIdOrAction }, '', newUrl);
        }
      }
    }

    const mainEl = document.getElementById('main-content-scroll');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Sync state on browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseUrlToRoute(isAgent);
      setRouteState(parsed);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAgent]);

  // Role-based route guard: keep activeTab strictly aligned with user role
  useEffect(() => {
    if (!isAuthenticated) return;

    const userRoleKey = currentUser?.roleKey || (isAgent ? 'agent' : 'super_admin');

    if (!hasModulePermission(userRoleKey, activeTab)) {
      const defaultTab = userRoleKey === 'agent' ? 'agent-dashboard' : 'dashboard';
      console.warn(`[RouteGuard] Role '${userRoleKey}' is restricted from accessing tab '${activeTab}'. Redirecting to ${defaultTab}.`);
      navigateTo(defaultTab, null, { replace: true });
    }
  }, [isAuthenticated, isAgent, currentUser, activeTab, navigateTo]);

  // Keep root URL synced when landing on /
  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined') {
      if (window.location.pathname === '/' || window.location.pathname === '') {
        const targetUrl = getUrlForRoute(activeTab, subAction === 'create' ? 'create' : selectedRecordId);
        window.history.replaceState({ tab: activeTab }, '', targetUrl);
      }
    }
  }, [isAuthenticated, activeTab, selectedRecordId, subAction]);

  // If user is not authenticated, show the Login Page
  if (!isAuthenticated) {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.history.replaceState({ tab: 'login' }, '', '/login');
    }
    return (
      <LoginPage
        onLoginSuccess={(loggedUser) => {
          const userRoleKey = loggedUser?.roleKey || 'super_admin';
          const isUserAgent = userRoleKey === 'agent';
          const parsed = parseUrlToRoute(isUserAgent);

          if (parsed.tab && hasModulePermission(userRoleKey, parsed.tab)) {
            navigateTo(parsed.tab, parsed.selectedRecordId || parsed.subAction, { replace: true });
          } else {
            const defaultTab = isUserAgent ? 'agent-dashboard' : 'dashboard';
            navigateTo(defaultTab, null, { replace: true });
          }
        }}
      />
    );
  }

  // Render content based on active tab & sub-action
  const renderContent = () => {
    switch (activeTab) {
      // 1. Dashboard
      case 'dashboard':
        return <OperationsDashboard onNavigate={navigateTo} />;

      // 2. Customer Profiles (⭐ PRIMARY MASTER MODULE)
      case 'customers':
        if (selectedRecordId) {
          return <CustomerDetail customerId={selectedRecordId} onNavigate={navigateTo} />;
        }
        return <CustomersList onNavigate={navigateTo} />;

      // 3. Warehouse Receipts (WR)
      case 'warehouse-receipts':
        if (subAction === 'create') {
          return <CreateWarehouseReceipt onNavigate={navigateTo} />;
        }
        if (selectedRecordId) {
          return <WarehouseReceiptDetail receiptId={selectedRecordId} onNavigate={navigateTo} />;
        }
        return <WarehouseReceiptsList onNavigate={navigateTo} />;

      // 4. Cargo Inventory
      case 'cargo':
        if (selectedRecordId) {
          return <CargoDetail cargoId={selectedRecordId} onNavigate={navigateTo} />;
        }
        return <CargoList onNavigate={navigateTo} />;

      // 5. House Bills of Lading (HBL) (⭐ PRIMARY MASTER MODULE)
      case 'house-bills':
        if (subAction === 'create') {
          return <CreateHouseBill onNavigate={navigateTo} />;
        }
        if (selectedRecordId) {
          return <HouseBillDetail hblId={selectedRecordId} onNavigate={navigateTo} />;
        }
        return <HouseBillsList onNavigate={navigateTo} />;

      // 6. Consolidations
      case 'consolidations':
        if (subAction === 'create') {
          return <NewConsolidationWizard onNavigate={navigateTo} />;
        }
        return <ConsolidationsList onNavigate={navigateTo} />;

      // 7. Shipments
      case 'shipments':
        if (subAction === 'create') {
          return <CreateShipment onNavigate={navigateTo} />;
        }
        if (selectedRecordId) {
          return <ShipmentDetail shipmentId={selectedRecordId} onNavigate={navigateTo} />;
        }
        return <ShipmentsList onNavigate={navigateTo} />;

      // 8. Bills of Lading (Master B/L)
      case 'bills-of-lading':
        if (selectedRecordId) {
          return <BillOfLadingDetail blId={selectedRecordId} onNavigate={navigateTo} />;
        }
        return <BillsOfLadingList onNavigate={navigateTo} />;

      // 9. Shipping Manifests
      case 'manifests':
        if (selectedRecordId) {
          return <ManifestDetail manifestId={selectedRecordId} onNavigate={navigateTo} />;
        }
        return <ManifestsList onNavigate={navigateTo} />;

      // 10. Vessels & Voyages
      case 'vessels':
        return <VesselsList onNavigate={navigateTo} />;

      // 11. Containers
      case 'containers':
        return <ContainersList onNavigate={navigateTo} />;

      // 12. Tracking
      case 'tracking':
        return <ShipmentTrackingPortal initialQuery={selectedRecordId} onNavigate={navigateTo} />;

      // 13. Documents
      case 'documents':
        return <DocumentCenter onNavigate={navigateTo} />;

      // 14. Agents Management
      case 'agents':
        if (selectedRecordId) {
          return <AgentDetail agentId={selectedRecordId} onNavigate={navigateTo} />;
        }
        return <AgentManagementList onNavigate={navigateTo} />;

      // 15. Users & Roles
      case 'users':
        return <UsersList onNavigate={navigateTo} />;

      // 16. Audit Trail
      case 'audit':
        return <AuditTrailList onNavigate={navigateTo} />;

      // 17. Shipment History
      case 'history':
        return <ShipmentHistoryArchive onNavigate={navigateTo} />;

      // 18. Settings
      case 'settings':
        return <SettingsPage onNavigate={navigateTo} />;

      // 19. Dedicated Agent Portal Views
      case 'agent-dashboard':
        return <AgentDashboard onNavigate={navigateTo} />;
      case 'agent-shipments':
        return <AgentShipmentsList onNavigate={navigateTo} />;
      case 'agent-bl-detail':
        return <AgentBLDetail blId={selectedRecordId || 'BL-VI-2026-0092'} onNavigate={navigateTo} />;
      case 'agent-documents':
        return <AgentDocuments onNavigate={navigateTo} />;
      case 'agent-tracking':
        return <ShipmentTrackingPortal initialQuery="TRK-VI-994819" onNavigate={navigateTo} />;

      default:
        return <OperationsDashboard onNavigate={navigateTo} />;
    }
  };

  // Everyone uses AppLayout, Sidebar internal logic handles menu filtering


  return (
    <AppLayout
      activeTab={activeTab}
      onSelectTab={(tab) => navigateTo(tab)}
      onNavigateDetail={(tab, id) => navigateTo(tab, id)}
    >
      {renderContent()}
    </AppLayout>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppDataProvider>
          <MainAppRouter />
        </AppDataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
