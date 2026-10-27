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

export const ROLE_PREFIX_MAP = {
  super_admin: 'superadmin',
  operations: 'operations',
  documentation: 'documentation',
  warehouse: 'warehouse',
  agent: 'agent'
};

export const VALID_ROLE_PREFIXES = ['superadmin', 'operations', 'documentation', 'warehouse', 'agent'];

export const getPrefixForRole = (roleKey) => {
  return ROLE_PREFIX_MAP[roleKey] || 'superadmin';
};

const parseUrlToRoute = (isAgent, currentRoleKey = null) => {
  const defaultPrefix = getPrefixForRole(currentRoleKey || (isAgent ? 'agent' : 'super_admin'));
  const defaultTab = isAgent ? 'agent-dashboard' : 'dashboard';

  if (typeof window === 'undefined') {
    return { tab: defaultTab, selectedRecordId: null, subAction: null, detectedPrefix: defaultPrefix };
  }

  let path = window.location.pathname || '';
  if (window.location.hash && window.location.hash.startsWith('#/')) {
    path = window.location.hash.slice(1);
  }

  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) {
    return {
      tab: defaultTab,
      selectedRecordId: null,
      subAction: null,
      detectedPrefix: defaultPrefix
    };
  }

  let detectedPrefix = null;
  let remainingSegments = segments;

  if (VALID_ROLE_PREFIXES.includes(segments[0])) {
    detectedPrefix = segments[0];
    remainingSegments = segments.slice(1);
  }

  if (remainingSegments.length === 0) {
    return {
      tab: defaultTab,
      selectedRecordId: null,
      subAction: null,
      detectedPrefix: detectedPrefix || defaultPrefix
    };
  }

  const [tab, second, ...rest] = remainingSegments;

  if (tab === 'login') {
    return { tab: defaultTab, selectedRecordId: null, subAction: null, detectedPrefix };
  }

  if (VALID_TABS.includes(tab)) {
    // Role protection: Agent cannot access internal staff operations tabs
    const agentAllowedTabs = [
      'agent-dashboard', 'agent-shipments', 'agent-bl-detail', 'agent-documents', 'agent-tracking',
      'shipments', 'consolidations', 'manifests', 'bills-of-lading', 'cargo', 'tracking',
      'warehouse-receipts', 'house-bills', 'customers'
    ];

    if (isAgent && !agentAllowedTabs.includes(tab)) {
      return { tab: 'agent-dashboard', selectedRecordId: null, subAction: null, detectedPrefix };
    }
    // Role protection: Staff/Super Admin cannot be trapped in agent portal tabs
    if (!isAgent && tab.startsWith('agent-')) {
      return { tab: 'dashboard', selectedRecordId: null, subAction: null, detectedPrefix };
    }

    if (isAgent && tab === 'shipments') {
      return { tab: 'agent-shipments', selectedRecordId: null, subAction: null, detectedPrefix };
    }

    if (second === 'create') {
      return { tab, selectedRecordId: null, subAction: 'create', detectedPrefix };
    }
    if (second) {
      const recordId = decodeURIComponent([second, ...rest].join('/'));
      return { tab, selectedRecordId: recordId, subAction: 'detail', detectedPrefix };
    }
    return { tab, selectedRecordId: null, subAction: null, detectedPrefix };
  }

  return {
    tab: defaultTab,
    selectedRecordId: null,
    subAction: null,
    detectedPrefix
  };
};

const getUrlForRoute = (tab, recordIdOrAction, roleKey = 'super_admin') => {
  const prefix = getPrefixForRole(roleKey);
  const cleanTab = (!tab || tab === 'dashboard' || tab === 'agent-dashboard') ? 'dashboard' : tab;

  if (cleanTab === 'dashboard') {
    return `/${prefix}/dashboard`;
  }
  if (cleanTab === 'agent-shipments') {
    return `/${prefix}/shipments`;
  }
  if (recordIdOrAction === 'create') {
    return `/${prefix}/${cleanTab}/create`;
  }
  if (recordIdOrAction) {
    return `/${prefix}/${cleanTab}/${encodeURIComponent(recordIdOrAction)}`;
  }
  return `/${prefix}/${cleanTab}`;
};
// Global Page Error Boundary to prevent blank white screens (defined at module level to preserve component state across re-renders)
class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PageErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2.5rem',
          maxWidth: '600px',
          margin: '2rem auto',
          background: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h3 style={{ color: '#0A192F', fontWeight: 800, marginBottom: '0.5rem' }}>View Encountered a Display Notice</h3>
          <p style={{ color: '#64748B', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {this.state.error?.message || 'A data display error occurred while rendering this view.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 600 }}
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn btn-outline btn-sm"
              style={{ fontWeight: 600 }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainAppRouter = () => {
  const { isAuthenticated, isAgent, currentUser } = useAuth();
  const { fetchMenuApi } = useAppData();

  const userRoleKey = currentUser?.roleKey || (isAgent ? 'agent' : 'super_admin');

  const [routeState, setRouteState] = useState(() => parseUrlToRoute(isAgent, userRoleKey));
  const { tab: activeTab, selectedRecordId, subAction } = routeState;

  // On activeTab change, trigger ONLY the clicked menu's API
  useEffect(() => {
    if (isAuthenticated && activeTab && fetchMenuApi) {
      fetchMenuApi(activeTab);
    }
  }, [isAuthenticated, activeTab, fetchMenuApi]);

  // Unified navigateTo function that updates state, browser URL, and history
  const navigateTo = useCallback((tab, recordIdOrAction = null, options = {}) => {
    const { replace = false, skipHistory = false, roleKey: overrideRoleKey } = options;
    const effectiveRoleKey = overrideRoleKey || userRoleKey;
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
      subAction: newAction,
      detectedPrefix: getPrefixForRole(effectiveRoleKey)
    });

    if (!skipHistory && typeof window !== 'undefined') {
      const newUrl = getUrlForRoute(tab, recordIdOrAction, effectiveRoleKey);
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
  }, [userRoleKey]);

  // Sync state on browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseUrlToRoute(isAgent, userRoleKey);
      setRouteState(parsed);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAgent, userRoleKey]);

  // Role-based route guard: keep activeTab strictly aligned with user role & sync namespaced URL
  useEffect(() => {
    if (!isAuthenticated) return;

    if (!hasModulePermission(userRoleKey, activeTab)) {
      const defaultTab = userRoleKey === 'agent' ? 'agent-dashboard' : 'dashboard';
      console.warn(`[RouteGuard] Role '${userRoleKey}' is restricted from accessing tab '${activeTab}'. Redirecting to ${defaultTab}.`);
      navigateTo(defaultTab, null, { replace: true });
      return;
    }

    // Keep browser URL aligned with namespaced role route
    if (typeof window !== 'undefined') {
      const expectedUrl = getUrlForRoute(activeTab, subAction === 'create' ? 'create' : selectedRecordId, userRoleKey);
      if (window.location.pathname !== expectedUrl) {
        window.history.replaceState({ tab: activeTab, recordIdOrAction: selectedRecordId }, '', expectedUrl);
      }
    }
  }, [isAuthenticated, isAgent, userRoleKey, activeTab, selectedRecordId, subAction, navigateTo]);

  // If user is not authenticated, show the Login Page
  if (!isAuthenticated) {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.history.replaceState({ tab: 'login' }, '', '/login');
    }
    return (
      <LoginPage
        onLoginSuccess={(loggedUser) => {
          const roleKey = loggedUser?.roleKey || 'super_admin';
          const isUserAgent = roleKey === 'agent';
          const defaultTab = isUserAgent ? 'agent-dashboard' : 'dashboard';
          navigateTo(defaultTab, null, { replace: true, roleKey });
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
        if (isAgent || userRoleKey === 'agent') {
          return <AgentShipmentsList onNavigate={navigateTo} />;
        }
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

      // 9. Shipping Manifests (Unified with Master B/L)
      case 'manifests':
        if (selectedRecordId) {
          return <ManifestDetail manifestId={selectedRecordId} onNavigate={navigateTo} />;
        }
        return <BillsOfLadingList initialTab="manifests" onNavigate={navigateTo} />;

      // 10. Fleet Directory
      case 'vessels':
        return <VesselsList onNavigate={navigateTo} />;

      // 11. Tracking
      case 'tracking':
        return <ShipmentTrackingPortal initialQuery={selectedRecordId} onNavigate={navigateTo} />;

      // 13. Documents (Redirected to Warehouse Receipts)
      case 'documents':
      case 'agent-documents':
        return <WarehouseReceiptsList onNavigate={navigateTo} />;

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
      <PageErrorBoundary key={activeTab}>
        {renderContent()}
      </PageErrorBoundary>
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
