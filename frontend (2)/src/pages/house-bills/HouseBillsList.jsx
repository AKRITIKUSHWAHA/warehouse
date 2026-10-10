import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import { HouseBillModal } from '../../components/modals/HouseBillModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import {
  FileText,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Layers,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Package,
  Building2,
  Ship
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { canManageHolds } from '../../config/rolePermissions';

export const HouseBillsList = ({ onNavigate }) => {
  const { houseBills, deleteHouseBill, updateHouseBill, placeHBLHold, clearHBLHold, billsOfLading, fetchMenuApi } = useAppData();
  const { isAgent, currentUser } = useAuth();

  const [editingHBL, setEditingHBL] = useState(null);
  const [deletingHBL, setDeletingHBL] = useState(null);

  useEffect(() => {
    if ((!houseBills || houseBills.length === 0) && fetchMenuApi) {
      fetchMenuApi('house-bills');
    }
  }, [fetchMenuApi]);

  // Filter if Agent
  const visibleHouseBills = isAgent
    ? houseBills.filter(h => h.agentId === currentUser?.agentId || h.portOfDischarge?.includes('Nassau'))
    : houseBills;

  const columns = [
    {
      header: 'House B/L #',
      accessor: 'hblNumber',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.hblNumber}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Issued: {item.issueDate || item.createdDate}
          </div>
        </div>
      )
    },
    {
      header: 'Customer & Consignee',
      accessor: 'customerName',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0A192F', fontSize: '0.875rem' }}>
            {item.customerName || (typeof item.consignee === 'object' ? item.consignee.name : item.consignee)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            From: {typeof item.shipper === 'object' ? item.shipper.name : item.shipper}
          </div>
        </div>
      )
    },
    {
      header: 'Destination Port',
      accessor: 'destinationPort',
      render: (item) => (
        <span style={{ fontWeight: 700, color: '#0284C7' }}>{item.destinationPort}</span>
      )
    },
    {
      header: 'Linked WRs',
      accessor: 'warehouseReceiptIds',
      render: (item) => {
        const wrs = item.warehouseReceiptIds || [];
        return (
          <div>
            <span style={{ fontWeight: 700, color: '#D97706', fontFamily: 'JetBrains Mono, monospace' }}>
              {wrs.length} WR(s)
            </span>
            <div style={{ fontSize: '0.7rem', color: '#64748B', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {wrs.join(', ')}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Total Cargo & Volume',
      accessor: 'totalCft',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0A192F' }}>
            {item.totalPieces || item.totalPackages} pieces ({item.totalWeightLbs?.toLocaleString()} lbs)
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706' }}>
            {item.totalCft} CFT <span style={{ color: '#0284C7', fontWeight: 600 }}>({item.totalCbm} CBM)</span>
          </div>
        </div>
      )
    },
    {
      header: 'Consolidation',
      accessor: 'assignedConsolidationId',
      render: (item) => (
        <div>
          {item.assignedConsolidationId ? (
            <span style={{ fontWeight: 700, color: '#059669', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
              {item.assignedConsolidationId}
            </span>
          ) : (
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontStyle: 'italic' }}>
              Not Consolidated
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => (
        <StatusBadge status={item.status || 'Active'} size="sm" />
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (item) => {
        const isOnHold = item.status === 'On Hold' || item.holdDetails?.isOnHold;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
            {canManageHolds(currentUser?.roleKey) && (
              isOnHold ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearHBLHold(item.id || item.hblNumber, 'Hold cleared from table');
                  }}
                  className="btn btn-sm btn-success"
                  title="Clear Hold on House B/L"
                  style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                >
                  <CheckCircle2 size={13} />
                  <span className="hide-mobile">Clear</span>
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    placeHBLHold(item.id || item.hblNumber, 'Documentation Hold', 'Awaiting clearance');
                  }}
                  className="btn btn-sm btn-ghost"
                  title="Place House B/L On Hold"
                  style={{ padding: '0.25rem 0.45rem', color: '#D97706' }}
                >
                  <AlertTriangle size={13} />
                </button>
              )
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingHBL(item);
              }}
              className="btn btn-sm btn-secondary"
              title="Edit House B/L"
              style={{ padding: '0.25rem 0.45rem' }}
            >
              <Edit2 size={13} />
              <span className="hide-mobile">Edit</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('house-bills', item.id);
              }}
              className="btn btn-sm btn-primary"
              style={{ padding: '0.25rem 0.6rem' }}
            >
              <Eye size={13} />
              <span>View</span>
            </button>

            {!isAgent && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingHBL(item);
                }}
                className="btn btn-sm btn-ghost"
                title="Delete House B/L"
                style={{ padding: '0.25rem 0.45rem', color: '#EF4444' }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        title="House Bills of Lading (HBL)"
        subtitle="Customer-level shipping documents linked from one or multiple warehouse receipts."
        icon={FileText}
        breadcrumbs={[
          { label: 'Maritime Documentation', href: '#' },
          { label: 'House Bills of Lading' }
        ]}
        actions={
          !isAgent && (
            <button
              onClick={() => onNavigate('house-bills', 'create')}
              className="btn btn-primary btn-sm"
            >
              <Plus size={15} />
              <span>Issue New HBL</span>
            </button>
          )
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
            onClick={() => onNavigate('bills-of-lading')}
            className="btn btn-sm btn-ghost"
            style={{ fontWeight: 600, fontSize: '0.8rem', padding: '0.35rem 0.85rem', color: '#475569', gap: '6px' }}
            title="Switch to ocean carrier Master Bills of Lading"
          >
            <Ship size={15} style={{ color: '#0284C7' }} />
            <span>Master Bills of Lading (MBL)</span>
            <span style={{ background: '#F1F5F9', color: '#475569', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
              {billsOfLading.length}
            </span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-primary"
            style={{ fontWeight: 700, fontSize: '0.8rem', padding: '0.35rem 0.85rem', gap: '6px' }}
          >
            <FileText size={15} />
            <span>House Bills of Lading (HBL)</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem' }}>
              {houseBills.length}
            </span>
          </button>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
          Showing <strong>Customer House B/Ls</strong>. Click Master B/L tab above to view carrier ocean documents.
        </div>
      </div>

      <ResponsiveTable
        columns={columns}
        data={visibleHouseBills}
        searchPlaceholder="Search by HBL #, customer, shipper, consignee, WR #, destination..."
        filterOptions={['All', 'Active', 'Draft', 'On Hold', 'Consolidated', 'Released']}
        pageSize={8}
        emptyTitle="No House Bills of Lading Found"
        emptyWhy="No customer House B/L records match your search or filter criteria."
        emptyNextStep="Create a House B/L by grouping staged Warehouse Receipts."
        emptyActionLabel="Create House B/L"
        onEmptyAction={() => onNavigate('house-bills', 'create')}
        onRowClick={(item) => onNavigate('house-bills', item.id)}
      />

      {/* Edit HBL Modal */}
      <HouseBillModal
        isOpen={!!editingHBL}
        hbl={editingHBL}
        onClose={() => setEditingHBL(null)}
        onSave={async (updates) => {
          await updateHouseBill(editingHBL.id, updates);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingHBL}
        onClose={() => setDeletingHBL(null)}
        itemName={deletingHBL?.hblNumber}
        itemType="House Bill of Lading"
        onConfirm={async () => {
          await deleteHouseBill(deletingHBL.id);
        }}
      />
    </div>
  );
};
