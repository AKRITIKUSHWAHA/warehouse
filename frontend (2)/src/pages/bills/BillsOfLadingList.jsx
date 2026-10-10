import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ClearHoldModal } from '../../components/modals/ClearHoldModal';
import { PlaceHoldModal } from '../../components/modals/PlaceHoldModal';
import { BillOfLadingModal } from '../../components/modals/BillOfLadingModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import {
  FileText,
  Eye,
  Edit2,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Download,
  AlertTriangle,
  Plus,
  Ship,
  HelpCircle,
  FileCheck,
  RefreshCw,
  Lock
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const BillsOfLadingList = ({ onNavigate }) => {
  const { billsOfLading, clearBLHold, placeBLHold, createBillOfLading, updateBillOfLading, deleteBillOfLading, houseBills, fetchMenuApi } = useAppData();
  const { isAgent, currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeBLForClear, setActiveBLForClear] = useState(null);
  const [activeBLForPlace, setActiveBLForPlace] = useState(null);
  const [editingBL, setEditingBL] = useState(null);
  const [deletingBL, setDeletingBL] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if ((!billsOfLading || billsOfLading.length === 0) && fetchMenuApi) {
      fetchMenuApi('bills-of-lading');
    }
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (fetchMenuApi) await fetchMenuApi('bills-of-lading');
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const visibleBLs = isAgent
    ? billsOfLading.filter(b => {
        if (!currentUser?.agentId && !currentUser?.destinationPortCode) return true;
        const bPort = (b.portOfDischarge || '').toUpperCase();
        const bAgentId = b.agentId;
        const userPort = (currentUser?.destinationPortCode || 'NAS').toUpperCase();
        const userAgentId = currentUser?.agentId;
        const userName = (currentUser?.name || '').toLowerCase();
        const bAgentName = (b.agentName || '').toLowerCase();

        if (userAgentId && bAgentId === userAgentId) return true;
        if (b.destinationPortCode && b.destinationPortCode === currentUser?.destinationPortCode) return true;
        if (userPort && (bPort.includes(userPort) || bPort.includes('NASSAU') || bPort.includes('BAHAMAS'))) return true;
        if (userName && bAgentName.includes(userName)) return true;
        if (bAgentName.includes('caribbean')) return true;
        return true;
      })
    : billsOfLading;

  // Table Columns with Contextual Actions per Status
  const columns = [
    {
      header: 'B/L Number',
      accessor: 'blNumber',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.blNumber}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Issue: {item.issueDate || item.createdDate}
          </div>
        </div>
      )
    },
    {
      header: 'Consignee & Shipper',
      accessor: 'consignee',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0A192F' }}>{item.consignee?.name || item.consignee}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>From: {item.shipper?.name || item.shipper}</div>
        </div>
      )
    },
    {
      header: 'Vessel & Voyage',
      accessor: 'oceanVessel',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{item.oceanVessel}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.voyageNumber} • {item.carrier}</div>
        </div>
      )
    },
    {
      header: 'Port of Discharge',
      accessor: 'portOfDischarge',
      render: (item) => (
        <span style={{ fontWeight: 600, color: '#0284C7' }}>{item.portOfDischarge}</span>
      )
    },
    {
      header: 'Container & Volume',
      accessor: 'containerNumber',
      render: (item) => (
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 600 }}>
            {item.containerNumber}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
            {item.packageCount} pkgs • <strong style={{ color: '#D97706' }}>{item.cft || (item.cbm ? Number((item.cbm * 35.3147).toFixed(1)) : 0)} CFT</strong> ({item.cbm} CBM)
          </div>
        </div>
      )
    },
    {
      header: 'B/L Status',
      accessor: 'status',
      render: (item) => (
        <div>
          <StatusBadge status={item.status} />
          {item.status === 'On Hold' && (
            <div style={{ fontSize: '0.68rem', color: '#B45309', marginTop: '2px', fontWeight: 600 }}>
              Payment / Review Pending
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (item) => {
        const isOnHold = item.status === 'On Hold' || item.holdDetails?.isOnHold;
        const isCancelled = item.status === 'Cancelled';
        const isReleased = item.status === 'Released';
        const isDraft = item.status === 'Draft';

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
            {/* CONTEXTUAL ACTION 1: Draft -> Review / Place Hold (Head Office Staff only) */}
            {!isAgent && isDraft && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveBLForPlace(item);
                }}
                className="btn btn-sm btn-ghost"
                title="Place Hold on Draft B/L"
                style={{ padding: '0.25rem 0.45rem', color: '#D97706', fontSize: '0.75rem' }}
              >
                <AlertTriangle size={13} />
                <span className="hide-mobile">Hold</span>
              </button>
            )}

            {/* CONTEXTUAL ACTION 2: On Hold -> View Reason / Clear Hold (Head Office Staff only) */}
            {!isAgent && isOnHold && !isCancelled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveBLForClear(item);
                }}
                className="btn btn-sm btn-success"
                title="Clear Hold and Release B/L"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                <CheckCircle2 size={13} />
                <span>Clear Hold</span>
              </button>
            )}

            {/* Read-Only Status Indicator for Destination Agent */}
            {isAgent && isOnHold && (
              <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', padding: '0.2rem 0.45rem', background: '#FEF2F2', borderRadius: '4px', border: '1px solid #FECACA' }}>
                <Lock size={12} />
                <span>Hold Active</span>
              </span>
            )}

            {/* CONTEXTUAL ACTION 3: Released -> Edit if authorized */}
            {isReleased && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingBL(item);
                }}
                className="btn btn-sm btn-secondary"
                title="Edit Released B/L"
                style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
              >
                <Edit2 size={13} />
                <span className="hide-mobile">Edit</span>
              </button>
            )}

            {/* Primary Action: View B/L (Always visible for all statuses) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('bills-of-lading', item.id || item.blNumber);
              }}
              className="btn btn-sm btn-primary"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            >
              <Eye size={13} />
              <span>View B/L</span>
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header */}
      <PageHeader
        title="Bills of Lading"
        subtitle="Manage carrier Master B/Ls, hold restrictions, authorized releases, and customer House B/Ls."
        icon={FileText}
        breadcrumbs={[
          { label: 'Maritime', href: '#' },
          { label: 'Bills of Lading' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={handleManualRefresh}
              className="btn btn-outline btn-sm"
              title="Refresh B/Ls from Database"
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hide-mobile">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
            {!isAgent && (
              <>
                <button
                  onClick={() => onNavigate('house-bills', 'create')}
                  className="btn btn-outline btn-sm"
                  title="Issue customer House Bill of Lading"
                >
                  <Plus size={15} />
                  <span>+ Issue House B/L</span>
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary btn-sm"
                  title="Issue ocean carrier Master Bill of Lading"
                >
                  <Plus size={15} />
                  <span>+ Issue Master B/L</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Subtle Workflow Indicator */}
      <WorkflowIndicator currentStage="bills-of-lading" onNavigate={onNavigate} />

      {/* ⭐ PROMINENT B/L CATEGORY TOGGLE: Solves client's "I don't see the house BL options" */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            style={{ fontWeight: 700, fontSize: '0.8rem', padding: '0.35rem 0.85rem', gap: '6px' }}
          >
            <Ship size={15} />
            <span>Master Bills of Lading (MBL)</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem' }}>
              {visibleBLs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('house-bills')}
            className="btn btn-sm btn-ghost"
            style={{ fontWeight: 600, fontSize: '0.8rem', padding: '0.35rem 0.85rem', color: '#475569', gap: '6px' }}
            title="Switch to customer House Bills of Lading"
          >
            <FileText size={15} style={{ color: '#2563EB' }} />
            <span>House Bills of Lading (HBL)</span>
            <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
              {houseBills.length}
            </span>
          </button>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
          Showing <strong>Carrier Master B/Ls</strong>. Click House B/L tab above to view customer consignment bills.
        </div>
      </div>

      {/* Master B/L Table with Clear Empty State */}
      <ResponsiveTable
        columns={columns}
        data={visibleBLs}
        searchPlaceholder="Search B/L #, consignee, shipper, container, vessel..."
        filterOptions={['All', 'Draft', 'On Hold', 'Released', 'Cancelled']}
        pageSize={8}
        emptyTitle="No Master Bills of Lading Found"
        emptyWhy="No Master B/L records match your search or filter criteria."
        emptyNextStep="Issue a new Master B/L or build a consolidation to generate one automatically."
        emptyActionLabel="Issue Master B/L"
        onEmptyAction={() => setShowAddModal(true)}
        onRowClick={(item) => onNavigate('bills-of-lading', item.id || item.blNumber)}
      />

      {/* Add Master B/L Modal */}
      <BillOfLadingModal
        isOpen={showAddModal}
        isEdit={false}
        onClose={() => setShowAddModal(false)}
        onSave={async (newBLData) => {
          await createBillOfLading(newBLData);
        }}
      />

      {/* Edit Master B/L Modal */}
      <BillOfLadingModal
        isOpen={!!editingBL}
        bl={editingBL}
        isEdit={true}
        onClose={() => setEditingBL(null)}
        onSave={async (updates) => {
          await updateBillOfLading(editingBL.id || editingBL.blNumber, updates);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingBL}
        onClose={() => setDeletingBL(null)}
        itemName={deletingBL?.blNumber}
        itemType="Bill of Lading"
        onConfirm={async () => {
          await deleteBillOfLading(deletingBL.id || deletingBL.blNumber);
        }}
      />

      {/* Clear Hold Modal */}
      <ClearHoldModal
        isOpen={!!activeBLForClear}
        onClose={() => setActiveBLForClear(null)}
        bl={activeBLForClear}
        onConfirm={async (id, notes) => {
          await clearBLHold(id || activeBLForClear.id || activeBLForClear.blNumber, notes);
        }}
      />

      {/* Place Hold Modal */}
      <PlaceHoldModal
        isOpen={!!activeBLForPlace}
        onClose={() => setActiveBLForPlace(null)}
        bl={activeBLForPlace}
        onConfirm={async (id, reason, notes) => {
          await placeBLHold(id || activeBLForPlace.id || activeBLForPlace.blNumber, reason, notes);
        }}
      />
    </div>
  );
};
