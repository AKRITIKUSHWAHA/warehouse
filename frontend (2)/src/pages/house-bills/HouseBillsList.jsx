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
  const { isAgent, currentUser } = useAuth();

  const [editingHBL, setEditingHBL] = useState(null);
  const [deletingHBL, setDeletingHBL] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeViewTab, setActiveViewTab] = useState(() => {
    return (houseBills && houseBills.length > 0) ? 'issued' : 'customers';
  });
  const [customerSearch, setCustomerSearch] = useState('');

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

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.destinationPort?.toLowerCase().includes(q) ||
      c.customerNumber?.toLowerCase().includes(q) ||
      c.contactPerson?.toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

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

                {!isAgent && (
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
        subtitle="Customer-level shipping documents linked from one or multiple warehouse receipts."
        icon={FileText}
        breadcrumbs={[
          { label: 'Maritime Documentation', href: '#' },
          { label: 'House Bills of Lading' }
        ]}
      />

      {/* Subtle Workflow Indicator */}
      <WorkflowIndicator currentStage="bills-of-lading" onNavigate={onNavigate} />

      {/* Primary Navigation Tabs: Customers Ready for HBL vs Issued House Bills */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '0.45rem 0.75rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => setActiveViewTab('customers')}
            className={`btn btn-sm ${activeViewTab === 'customers' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontWeight: 700, fontSize: '0.82rem', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Building2 size={15} />
            <span>Select Customer to Create HBL</span>
            <span
              style={{
                background: activeViewTab === 'customers' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                color: activeViewTab === 'customers' ? '#FFFFFF' : '#475569',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: 700
              }}
            >
              {customers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('issued')}
            className={`btn btn-sm ${activeViewTab === 'issued' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontWeight: 700, fontSize: '0.82rem', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={15} />
            <span>Issued House Bills (HBL)</span>
            <span
              style={{
                background: activeViewTab === 'issued' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                color: activeViewTab === 'issued' ? '#FFFFFF' : '#475569',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: 700
              }}
            >
              {visibleHouseBills.length}
            </span>
          </button>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
          {activeViewTab === 'customers'
            ? 'Select a customer below to create their House Bill of Lading from warehouse receipts.'
            : 'List of customer transport House Bills of Lading.'}
        </div>
      </div>

      {/* VIEW 1: Customer Table (DIRECTLY VISIBLE ON THIS PAGE) */}
      {activeViewTab === 'customers' && (
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0A192F', margin: 0 }}>
                Customers Ready for House Bill of Lading
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Select any customer account below to create an official House transport document linking their staged warehouse receipts.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.35rem 0.65rem' }}>
              <Search size={15} style={{ color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search customers, port, phone..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: '220px' }}
              />
              {customerSearch && (
                <button type="button" onClick={() => setCustomerSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 0 }}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Customer / Consignee</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Destination Port</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Contact Person &amp; Phone</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Staged Warehouse Receipts</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B', fontSize: '0.85rem' }}>
                      No customer account profiles match your search "{customerSearch}".
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(c => {
                    const stagedWrCount = warehouseReceipts.filter(w => {
                      const cId = w.customerId || w.customer_id;
                      const match = cId === c.id ||
                        w.customer?.trim().toLowerCase() === c.name?.trim().toLowerCase() ||
                        w.customerName?.trim().toLowerCase() === c.name?.trim().toLowerCase() ||
                        (w.consignee && w.consignee.toLowerCase().includes(c.name?.trim().toLowerCase()));
                      return match && !w.assignedHouseBillId && w.status !== 'Consolidated' && w.status !== 'Cancelled';
                    }).length;

                    return (
                      <tr
                        key={c.id}
                        style={{
                          borderBottom: '1px solid #E2E8F0',
                          background: '#FFFFFF',
                          transition: 'background-color 150ms ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                      >
                        <td style={{ padding: '0.8rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: '#0A192F', fontSize: '0.9rem' }}>
                            {c.name}
                          </div>
                          {c.customerNumber && (
                            <div style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
                              {c.customerNumber}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.8rem 1rem' }}>
                          <span style={{ fontWeight: 700, color: '#0284C7', fontSize: '0.85rem' }}>
                            {c.destinationPort || 'CFS Cargo Hub'}
                          </span>
                        </td>
                        <td style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: '#334155' }}>
                          <div>{c.contactPerson || '—'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            {c.telephone || c.phone || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '0.8rem 1rem', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: stagedWrCount > 0 ? '#DCFCE7' : '#F1F5F9',
                              color: stagedWrCount > 0 ? '#15803D' : '#64748B'
                            }}
                          >
                            {stagedWrCount} Available WR(s)
                          </span>
                        </td>
                        <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => {
                              try { localStorage.setItem('vicustoms_selected_hbl_customer', c.id); } catch(e) {}
                              onNavigate('house-bills', 'create');
                            }}
                            className="btn btn-primary btn-sm"
                            style={{
                              padding: '0.35rem 0.85rem',
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <FileText size={14} />
                            <span>Create House Bill</span>
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Issued House Bills Table */}
      {activeViewTab === 'issued' && (
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
          onEmptyAction={() => setActiveViewTab('customers')}
          onRowClick={(item) => onNavigate('house-bills', item.id)}
        />
      )}

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
