import React, { useState, useEffect, useMemo } from 'react';
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
  Ship,
  MoreVertical,
  Search,
  ChevronRight,
  X
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { canManageHolds } from '../../config/rolePermissions';

export const HouseBillsList = ({ onNavigate }) => {
  const { houseBills, customers = [], warehouseReceipts = [], deleteHouseBill, updateHouseBill, placeHBLHold, clearHBLHold, billsOfLading, fetchMenuApi } = useAppData();
  const { isAgent, isWarehouse, currentUser } = useAuth();

  const [editingHBL, setEditingHBL] = useState(null);
  const [deletingHBL, setDeletingHBL] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (fetchMenuApi) {
      fetchMenuApi('house-bills');
    }
  }, [fetchMenuApi]);

  // Filter if Agent
  const visibleHouseBills = isAgent
    ? houseBills.filter(h => h.agentId === currentUser?.agentId || (currentUser?.destinationPortCode && h.destinationCode === currentUser.destinationPortCode))
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
          {item.assignedConsolidationId && (
            <div style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 700 }}>
              Consol: {item.assignedConsolidationId}
            </div>
          )}
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Issued: {item.issueDate || item.createdDate}
          </div>
        </div>
      )
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (item) => {
        const rawCust = item.customerName || item.customer;
        const shipperName = typeof item.shipper === 'object' ? item.shipper?.name : item.shipper;
        // If rawCust looks like an address line (e.g. "rd Floor", "3rd Floor") and shipperName exists, use shipperName
        const isAddressLike = rawCust && /^\s*(\d*(st|nd|rd|th)?\s*floor|gala\s*no|plot\s*no|suite|apt|unit|ste)\b/i.test(rawCust);
        const displayName = (!rawCust || isAddressLike) && shipperName ? shipperName : (rawCust || shipperName || 'Customer');

        return (
          <div style={{ fontWeight: 700, color: '#0A192F', fontSize: '0.875rem' }}>
            {displayName}
          </div>
        );
      }
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
      header: 'Status',
      accessor: 'status',
      render: (item) => (
        <StatusBadge status={item.status || 'Active'} size="sm" />
      )
    },
    {
      header: 'Actions',
      align: 'right',
      width: '70px',
      render: (item) => {
        const menuKey = item.id || item.hblNumber;
        const isOpen = activeMenuId === menuKey;
        const isOnHold = item.status === 'On Hold' || item.holdDetails?.isOnHold;

        return (
          <div
            style={{ position: 'relative', display: 'inline-block', textAlign: 'right' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(isOpen ? null : menuKey);
              }}
              className="btn btn-ghost btn-sm"
              style={{
                width: '32px',
                height: '32px',
                padding: 0,
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isOpen ? '#0284C7' : '#64748B',
                background: isOpen ? '#F0F9FF' : 'transparent',
                border: '1px solid',
                borderColor: isOpen ? '#BAE6FD' : 'transparent',
                cursor: 'pointer'
              }}
              title="Actions"
              aria-label="Actions"
            >
              <MoreVertical size={16} />
            </button>

            {isOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 4px)',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
                  zIndex: 9999,
                  minWidth: '185px',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  textAlign: 'left'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#1E293B',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => {
                    setActiveMenuId(null);
                    onNavigate('house-bills', item.id);
                  }}
                >
                  <Eye size={14} style={{ color: '#0284C7' }} />
                  <span>View Details</span>
                </button>

                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#1E293B',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => {
                    setActiveMenuId(null);
                    setEditingHBL(item);
                  }}
                >
                  <Edit2 size={14} style={{ color: '#64748B' }} />
                  <span>Edit House B/L</span>
                </button>

                {canManageHolds(currentUser?.roleKey) && (
                  isOnHold ? (
                    <button
                      type="button"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: '#059669',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#ECFDF5'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => {
                        setActiveMenuId(null);
                        clearHBLHold(item.id || item.hblNumber, 'Hold cleared from table');
                      }}
                    >
                      <CheckCircle2 size={14} style={{ color: '#059669' }} />
                      <span>Clear Hold &amp; Release</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: '#D97706',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#FFFBEB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => {
                        setActiveMenuId(null);
                        placeHBLHold(item.id || item.hblNumber, 'Documentation Hold', 'Awaiting clearance');
                      }}
                    >
                      <AlertTriangle size={14} style={{ color: '#D97706' }} />
                      <span>Place On Hold</span>
                    </button>
                  )
                )}

                {!isAgent && !isWarehouse && (
                  <>
                    <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />
                    <button
                      type="button"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: '#EF4444',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => {
                        setActiveMenuId(null);
                        setDeletingHBL(item);
                      }}
                    >
                      <Trash2 size={14} style={{ color: '#EF4444' }} />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
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
        subtitle="Step 2: Link staged warehouse receipts to a House Bill with your company Consolidation Number."
        icon={FileText}
        breadcrumbs={[
          { label: 'Maritime Documentation', href: '#' },
          { label: 'House Bills of Lading' }
        ]}
        actions={
          !isAgent && (
            <button
              type="button"
              onClick={() => onNavigate('house-bills', 'create')}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>Create House Bill (Link WRs)</span>
            </button>
          )
        }
      />

      {/* Subtle Workflow Indicator */}
      <WorkflowIndicator currentStage="bills-of-lading" onNavigate={onNavigate} />

      {/* Primary House Bills Table */}
      <ResponsiveTable
        columns={columns}
        data={visibleHouseBills}
        searchPlaceholder="Search by HBL #, customer, WR #, destination, Consol #..."
        filterOptions={['All']}
        pageSize={10}
        emptyTitle="No House Bills of Lading Found"
        emptyWhy="No customer House B/L records have been created yet."
        emptyNextStep="Create a House B/L by linking staged Warehouse Receipts with your company Consolidation Number."
        emptyActionLabel="Create House Bill (Link WRs)"
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
