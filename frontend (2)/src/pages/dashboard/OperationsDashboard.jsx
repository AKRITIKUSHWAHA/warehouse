import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { HoldAlertBanner } from '../../components/common/HoldAlertBanner';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import {
  Ship,
  Package,
  Layers,
  FileText,
  Box,
  Users,
  AlertTriangle,
  ArrowRight,
  Plus,
  Compass,
  CheckCircle2,
  Anchor,
  Clock,
  ExternalLink,
  ChevronRight,
  Building2,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Tag,
  AlertCircle
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services';

export const OperationsDashboard = ({ onNavigate }) => {
  const { customers, warehouseReceipts, houseBills, consolidations, shipments, billsOfLading, manifests, containers, cargoItems } = useAppData();
  const { currentUser } = useAuth();

  const roleKey = currentUser?.roleKey || 'super_admin';
  const [dbMetrics, setDbMetrics] = useState(null);

  useEffect(() => {
    if (roleKey === 'super_admin') {
      adminService.getDashboardMetrics().then(data => {
        if (data) setDbMetrics(data);
      });
    }
  }, [roleKey]);


  // Metrics for Action Tasks
  const readyReceipts = (warehouseReceipts || []).filter(w => w.status === 'Ready for Consolidation');
  const stagedCargo = (cargoItems || []).filter(c => c.status === 'Ready for Consolidation' || !c.assignedConsolidationId);
  const activeConsolidations = (consolidations || []).filter(c => c.status !== 'Departed' && c.status !== 'Delivered');
  const activeShipments = (shipments || []).filter(s => s.status !== 'Delivered');
  const holdBLs = (billsOfLading || []).filter(b => b.status === 'On Hold' || b.holdDetails?.isOnHold);
  const draftBLs = (billsOfLading || []).filter(b => b.status === 'Draft');
  const pendingManifestShipments = (shipments || []).filter(s => !s.manifestNumber || s.status === 'Booked' || s.status === 'Consolidated');

  // Shipment columns
  const shipmentColumns = [
    {
      header: 'Shipment #',
      accessor: 'shipmentNumber',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.shipmentNumber}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Trk: {item.trackingNumber}
          </div>
        </div>
      )
    },
    {
      header: 'Destination',
      accessor: 'destinationPort',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0A192F' }}>{item.destinationPort}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>From {item.origin}</div>
        </div>
      )
    },
    {
      header: 'Vessel / Container',
      accessor: 'vesselName',
      render: (item) => (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.vesselName}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.containerNumber}
          </div>
        </div>
      )
    },
    {
      header: 'Shipment Status',
      accessor: 'status',
      render: (item) => <StatusBadge status={item.status} />
    },
    {
      header: 'B/L Status',
      accessor: 'blStatus',
      render: (item) => <StatusBadge status={item.blStatus} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('shipments', item.id);
          }}
          className="btn btn-sm btn-outline"
          style={{ padding: '0.25rem 0.5rem' }}
        >
          <span>View</span>
          <ArrowRight size={13} />
        </button>
      )
    }
  ];

  // Render role-specific task cards
  const renderActionTasks = () => {
    // 1. WAREHOUSE ROLE TASKS
    if (roleKey === 'warehouse') {
      return (
        <div className="grid grid-cols-3 gap-4" style={{ marginBottom: '1.25rem' }}>
          <div
            onClick={() => onNavigate('warehouse-receipts')}
            className="card card-hover"
            style={{ padding: '1.15rem', cursor: 'pointer', borderLeft: '4px solid #D97706' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>
                CFS Intake Queue
              </span>
              <Package size={18} style={{ color: '#D97706' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A192F', margin: '0.25rem 0' }}>
              {readyReceipts.length} Warehouse Receipts Ready
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Intake complete • Ready for consolidation</span>
              <ArrowRight size={13} style={{ color: '#D97706' }} />
            </div>
          </div>

          <div
            onClick={() => onNavigate('cargo')}
            className="card card-hover"
            style={{ padding: '1.15rem', cursor: 'pointer', borderLeft: '4px solid #0284C7' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase' }}>
                Warehouse Staging
              </span>
              <Box size={18} style={{ color: '#0284C7' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A192F', margin: '0.25rem 0' }}>
              {stagedCargo.length} Cargo Items Staged
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Check bay staging &amp; print roll labels</span>
              <ArrowRight size={13} style={{ color: '#0284C7' }} />
            </div>
          </div>

          <div
            onClick={() => onNavigate('documents')}
            className="card card-hover"
            style={{ padding: '1.15rem', cursor: 'pointer', borderLeft: '4px solid #10B981' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>
                Thermal Roll Printing
              </span>
              <Tag size={18} style={{ color: '#10B981' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A192F', margin: '0.25rem 0' }}>
              4x6 Cargo Labels
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Generate barcode stickers for pallets &amp; boxes</span>
              <ArrowRight size={13} style={{ color: '#10B981' }} />
            </div>
          </div>
        </div>
      );
    }

    // 2. OPERATIONS ROLE TASKS
    if (roleKey === 'operations') {
      return (
        <div className="grid grid-cols-3 gap-4" style={{ marginBottom: '1.25rem' }}>
          <div
            onClick={() => onNavigate('consolidations', 'create')}
            className="card card-hover"
            style={{ padding: '1.15rem', cursor: 'pointer', borderLeft: '4px solid #0284C7' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase' }}>
                Consolidation Queue
              </span>
              <Layers size={18} style={{ color: '#0284C7' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A192F', margin: '0.25rem 0' }}>
              {stagedCargo.length} Cargo Items Awaiting Consolidation
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Click to build ocean container consolidation</span>
              <ArrowRight size={13} style={{ color: '#0284C7' }} />
            </div>
          </div>

          <div
            onClick={() => onNavigate('consolidations')}
            className="card card-hover"
            style={{ padding: '1.15rem', cursor: 'pointer', borderLeft: '4px solid #D97706' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>
                Active Boxes
              </span>
              <Box size={18} style={{ color: '#D97706' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A192F', margin: '0.25rem 0' }}>
              {activeConsolidations.length} Consolidations In Progress
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Monitor volume utilization &amp; seal numbers</span>
              <ArrowRight size={13} style={{ color: '#D97706' }} />
            </div>
          </div>

          <div
            onClick={() => onNavigate('shipments')}
            className="card card-hover"
            style={{ padding: '1.15rem', cursor: 'pointer', borderLeft: '4px solid #10B981' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>
                Ocean Transit
              </span>
              <Ship size={18} style={{ color: '#10B981' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A192F', margin: '0.25rem 0' }}>
              {activeShipments.length} Master Shipments Active
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Track vessel sailings &amp; arrival milestones</span>
              <ArrowRight size={13} style={{ color: '#10B981' }} />
            </div>
          </div>
        </div>
      );
    }

    // 3. DOCUMENTATION ROLE TASKS
    if (roleKey === 'documentation') {
      return (
        <div className="grid grid-cols-3 gap-4" style={{ marginBottom: '1.25rem' }}>
          <div
            onClick={() => onNavigate('bills-of-lading')}
            className="card card-hover"
            style={{ padding: '1.15rem', cursor: 'pointer', borderLeft: `4px solid ${holdBLs.length > 0 ? '#EF4444' : '#10B981'}` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: holdBLs.length > 0 ? '#EF4444' : '#10B981', textTransform: 'uppercase' }}>
                Hold Management
              </span>
              <AlertTriangle size={18} style={{ color: holdBLs.length > 0 ? '#EF4444' : '#10B981' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A192F', margin: '0.25rem 0' }}>
              {holdBLs.length} B/Ls On Hold
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>{holdBLs.length > 0 ? 'Review payment / compliance holds' : 'All Master B/Ls clear'}</span>
              <ArrowRight size={13} style={{ color: '#EF4444' }} />
            </div>
          </div>

          <div
            onClick={() => onNavigate('manifests')}
            className="card card-hover"
            style={{ padding: '1.15rem', cursor: 'pointer', borderLeft: '4px solid #0284C7' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase' }}>
                Customs Clearance
              </span>
              <FileSpreadsheet size={18} style={{ color: '#0284C7' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A192F', margin: '0.25rem 0' }}>
              {pendingManifestShipments.length} Shipment Awaiting Manifest
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Generate XML / CSV for customs</span>
              <ArrowRight size={13} style={{ color: '#0284C7' }} />
            </div>
          </div>

          <div
            onClick={() => onNavigate('bills-of-lading')}
            className="card card-hover"
            style={{ padding: '1.15rem', cursor: 'pointer', borderLeft: '4px solid #D97706' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>
                Document Issuance
              </span>
              <FileText size={18} style={{ color: '#D97706' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A192F', margin: '0.25rem 0' }}>
              {billsOfLading.length} Master &amp; {houseBills.length} House B/Ls
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Review Drafts &amp; authorize releases</span>
              <ArrowRight size={13} style={{ color: '#D97706' }} />
            </div>
          </div>
        </div>
      );
    }

    // 4. SUPER ADMIN ROLE TASKS
    return (
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '1.25rem' }}>
        <div
          onClick={() => onNavigate('warehouse-receipts')}
          className="card card-hover"
          style={{ padding: '1rem', cursor: 'pointer', borderLeft: '4px solid #D97706' }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>
            CFS Warehouse
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0A192F', margin: '0.2rem 0' }}>
            {dbMetrics?.totalWarehouseReceipts ?? readyReceipts.length} WRs Ready
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Cargo Intake</div>
        </div>

        <div
          onClick={() => onNavigate('consolidations')}
          className="card card-hover"
          style={{ padding: '1rem', cursor: 'pointer', borderLeft: '4px solid #0284C7' }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase' }}>
            Operations
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0A192F', margin: '0.2rem 0' }}>
            {dbMetrics?.totalConsolidations ?? stagedCargo.length} Consolidations Active
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Consolidations</div>
        </div>

        <div
          onClick={() => onNavigate('bills-of-lading')}
          className="card card-hover"
          style={{ padding: '1rem', cursor: 'pointer', borderLeft: `4px solid ${(dbMetrics?.activeHoldsCount ?? holdBLs.length) > 0 ? '#EF4444' : '#10B981'}` }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: (dbMetrics?.activeHoldsCount ?? holdBLs.length) > 0 ? '#EF4444' : '#10B981', textTransform: 'uppercase' }}>
            Documentation
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0A192F', margin: '0.2rem 0' }}>
            {dbMetrics?.activeHoldsCount ?? holdBLs.length} B/Ls On Hold
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Holds &amp; Releases</div>
        </div>

        <div
          onClick={() => onNavigate('shipments')}
          className="card card-hover"
          style={{ padding: '1rem', cursor: 'pointer', borderLeft: '4px solid #10B981' }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>
            Maritime Fleet
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0A192F', margin: '0.2rem 0' }}>
            {dbMetrics?.totalShipments ?? activeShipments.length} In Transit
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            {dbMetrics?.totalContainers ? `${dbMetrics.totalContainers} Fleet Containers` : 'Active Ocean Shipments'}
          </div>
        </div>
      </div>
    );

  };

  // Header CTAs based on role
  const getHeaderActions = () => {
    if (roleKey === 'warehouse') {
      return (
        <button
          onClick={() => onNavigate('warehouse-receipts', 'create')}
          className="btn btn-primary btn-sm"
        >
          <Plus size={15} />
          <span>Create Warehouse Receipt</span>
        </button>
      );
    }
    if (roleKey === 'operations') {
      return (
        <button
          onClick={() => onNavigate('consolidations', 'create')}
          className="btn btn-primary btn-sm"
        >
          <Layers size={15} />
          <span>Build Consolidation</span>
        </button>
      );
    }
    if (roleKey === 'documentation') {
      return (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('bills-of-lading')}
            className="btn btn-outline btn-sm"
          >
            <FileText size={15} />
            <span>Review B/L</span>
          </button>
          <button
            onClick={() => onNavigate('manifests')}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} />
            <span>Create Manifest</span>
          </button>
        </div>
      );
    }
    // Super admin
    return (
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => onNavigate('warehouse-receipts', 'create')}
          className="btn btn-outline btn-sm"
        >
          <Package size={15} />
          <span>Warehouse Receipt</span>
        </button>
        <button
          onClick={() => onNavigate('consolidations', 'create')}
          className="btn btn-primary btn-sm"
        >
          <Layers size={15} />
          <span>Build Consolidation</span>
        </button>
      </div>
    );
  };

  const getRoleTitle = () => {
    switch (roleKey) {
      case 'warehouse':
        return 'Warehouse CFS Dashboard';
      case 'operations':
        return 'Operations Dashboard';
      case 'documentation':
        return 'Documentation Desk';
      default:
        return 'Executive Overview Dashboard';
    }
  };

  const getRoleSubtitle = () => {
    switch (roleKey) {
      case 'warehouse':
        return `Welcome, ${currentUser?.name}. Intake cargo, measure package dimensions, and print 4x6 labels.`;
      case 'operations':
        return `Welcome, ${currentUser?.name}. Consolidate staged cargo into ocean containers and dispatch vessels.`;
      case 'documentation':
        return `Welcome, ${currentUser?.name}. Review Bills of Lading, manage holds, and export customs manifests.`;
      default:
        return `Welcome, ${currentUser?.name}. High-level operational oversight and compliance monitoring.`;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header with Role-Specific Title and Primary CTA */}
      <PageHeader
        title={getRoleTitle()}
        subtitle={getRoleSubtitle()}
        icon={Compass}
        actions={getHeaderActions()}
      />

      {/* Prominent B/L Hold Warning Banner if holds active */}
      {holdBLs.length > 0 && (
        <div>
          {holdBLs.map(bl => (
            <HoldAlertBanner
              key={bl.id}
              blNumber={bl.blNumber}
              holdDetails={bl.holdDetails}
              onClearHoldClick={() => onNavigate('bills-of-lading', bl.id)}
            />
          ))}
        </div>
      )}

      {/* Subtle Visual 8-Step Workflow Indicator */}
      <WorkflowIndicator currentStage="warehouse-receipts" onNavigate={onNavigate} />

      {/* Prioritized Action Tasks: "What do I need to do next?" */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: '#0A192F', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={16} style={{ color: '#0284C7' }} />
            <span>Priority Actions &amp; Tasks — What to do next</span>
          </h3>
          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Click any task card to take immediate action
          </span>
        </div>
        {renderActionTasks()}
      </div>

      {/* Main Content Area based on role */}
      {roleKey === 'warehouse' ? (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '1rem', color: '#0A192F' }}>Recent Intake Receipts</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                CFS receiving records ready for staging and consolidation
              </p>
            </div>
            <button
              onClick={() => onNavigate('warehouse-receipts')}
              className="btn btn-ghost btn-sm"
            >
              <span>View All Receipts</span>
              <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ padding: '0.75rem' }}>
            <div className="grid grid-cols-2 gap-3 grid-cols-2-mobile">
              {warehouseReceipts.slice(0, 4).map(wr => (
                <div
                  key={wr.id}
                  onClick={() => onNavigate('warehouse-receipts', wr.id)}
                  style={{
                    padding: '0.75rem',
                    background: '#F8FAFC',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    cursor: 'pointer'
                  }}
                  className="card-hover"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ color: '#D97706', fontFamily: 'JetBrains Mono, monospace' }}>{wr.receiptNumber}</strong>
                    <StatusBadge status={wr.status} size="sm" />
                  </div>
                  <div style={{ fontWeight: 600, color: '#0A192F', fontSize: '0.85rem' }}>{wr.customer}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                    {wr.packageCount} pkgs ({wr.totalPieces || wr.packageCount} pcs) • <strong style={{ color: '#0284C7' }}>{wr.cft} CFT</strong> ({wr.cbm} CBM)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-5">
          {/* Active Shipments (8 cols) */}
          <div style={{ gridColumn: 'span 8' }} className="col-span-8-mobile">
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: '1rem', color: '#0A192F' }}>Active Master Shipments</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                    Real-time status of consolidated ocean freight containers
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('shipments')}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.78rem' }}
                >
                  <span>All Shipments</span>
                  <ChevronRight size={14} />
                </button>
              </div>
              <div style={{ padding: 0 }}>
                <ResponsiveTable
                  columns={shipmentColumns}
                  data={shipments}
                  searchable={false}
                  pageSize={4}
                  onRowClick={(item) => onNavigate('shipments', item.id)}
                />
              </div>
            </div>
          </div>

          {/* Quick Overview (4 cols) */}
          <div style={{ gridColumn: 'span 4' }} className="col-span-4-mobile">
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: '1rem', color: '#0A192F' }}>Workflow Shortcuts</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                    Jump directly to your next step
                  </p>
                </div>
              </div>
              <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                <button
                  onClick={() => onNavigate('warehouse-receipts', 'create')}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'space-between', padding: '0.6rem 0.75rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={16} style={{ color: '#D97706' }} />
                    <span style={{ fontWeight: 600 }}>1. Create Warehouse Receipt</span>
                  </div>
                  <ChevronRight size={14} style={{ color: '#94A3B8' }} />
                </button>

                <button
                  onClick={() => onNavigate('cargo')}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'space-between', padding: '0.6rem 0.75rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box size={16} style={{ color: '#0284C7' }} />
                    <span style={{ fontWeight: 600 }}>2. View Staged Cargo</span>
                  </div>
                  <ChevronRight size={14} style={{ color: '#94A3B8' }} />
                </button>

                <button
                  onClick={() => onNavigate('consolidations', 'create')}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'space-between', padding: '0.6rem 0.75rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={16} style={{ color: '#10B981' }} />
                    <span style={{ fontWeight: 600 }}>3. Build Consolidation</span>
                  </div>
                  <ChevronRight size={14} style={{ color: '#94A3B8' }} />
                </button>

                <button
                  onClick={() => onNavigate('bills-of-lading')}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'space-between', padding: '0.6rem 0.75rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} style={{ color: '#2563EB' }} />
                    <span style={{ fontWeight: 600 }}>4. Bills of Lading (Master &amp; House)</span>
                  </div>
                  <ChevronRight size={14} style={{ color: '#94A3B8' }} />
                </button>

                <button
                  onClick={() => onNavigate('manifests')}
                  className="btn btn-outline btn-sm"
                  style={{ justifyContent: 'space-between', padding: '0.6rem 0.75rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileSpreadsheet size={16} style={{ color: '#8B5CF6' }} />
                    <span style={{ fontWeight: 600 }}>5. Customs Manifests</span>
                  </div>
                  <ChevronRight size={14} style={{ color: '#94A3B8' }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
