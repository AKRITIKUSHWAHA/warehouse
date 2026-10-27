import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import { CargoLabelModal } from '../../components/modals/CargoLabelModal';
import { WarehouseReceiptModal } from '../../components/modals/WarehouseReceiptModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import {
  Package,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Printer,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  FileText,
  MoreVertical
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const WarehouseReceiptsList = ({ onNavigate }) => {
  const { warehouseReceipts, updateWarehouseReceipt, deleteWarehouseReceipt } = useAppData();
  const [labelCargo, setLabelCargo] = useState(null);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [deletingReceipt, setDeletingReceipt] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const columns = [
    {
      header: 'Receipt #',
      accessor: 'receiptNumber',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: '#D97706', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.receiptNumber}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            {item.date} ({item.time})
          </div>
        </div>
      )
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (item) => (
        <div style={{ fontWeight: 600, color: '#0A192F' }}>
          {item.customer || item.customerName || (typeof item.shipper === 'object' ? item.shipper?.name : item.shipper) || 'Valued Customer'}
        </div>
      )
    },
    {
      header: 'Packages & Cargo',
      accessor: 'packageCount',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600 }}>{item.packageCount} {item.packageType}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.cargoDescription}
          </div>
        </div>
      )
    },
    {
      header: 'Weight / Volume',
      accessor: 'weightLbs',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600 }}>{item.weightLbs?.toLocaleString()} lbs</div>
          <div style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 600 }}>
            {item.cbm || item.totalCbm || '0.00'} CBM ({item.cft || item.totalCft || '0.00'} CFT)
          </div>
        </div>
      )
    },
    {
      header: 'Destination Port',
      accessor: 'destinationPort',
      render: (item) => (
        <div>
          <span style={{ fontWeight: 700, color: '#0A192F' }}>{item.destinationCode}</span>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.destinationPort}</div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => <StatusBadge status={item.status} />
    },
    {
      header: 'Actions',
      align: 'right',
      width: '70px',
      render: (item) => {
        const isOpen = activeMenuId === item.id;

        return (
          <div
            style={{ position: 'relative', display: 'inline-block', textAlign: 'right' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(isOpen ? null : item.id);
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
                  minWidth: '175px',
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
                    onNavigate('warehouse-receipts', item.id);
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
                    setLabelCargo(item);
                  }}
                >
                  <Printer size={14} style={{ color: '#D97706' }} />
                  <span>Print 4x6 Label</span>
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
                    setEditingReceipt(item);
                  }}
                >
                  <Edit2 size={14} style={{ color: '#64748B' }} />
                  <span>Edit Receipt</span>
                </button>

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
                    setDeletingReceipt(item);
                  }}
                >
                  <Trash2 size={14} style={{ color: '#EF4444' }} />
                  <span>Delete</span>
                </button>
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
        title="Warehouse Receipts"
        subtitle="Record cargo received at the CFS and generate warehouse receipt numbers and labels."
        icon={Package}
        breadcrumbs={[
          { label: 'Operations', href: '#' },
          { label: 'Warehouse Receipts' }
        ]}
        actions={
          <button
            onClick={() => onNavigate('warehouse-receipts', 'create')}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} />
            <span>Create Warehouse Receipt</span>
          </button>
        }
      />

      <WorkflowIndicator currentStage="warehouse-receipts" onNavigate={onNavigate} />

      {/* Main Table with Clear Empty State */}
      <ResponsiveTable
        columns={columns}
        data={warehouseReceipts}
        searchPlaceholder="Search by receipt #, customer, cargo, destination..."
        pageSize={8}
        emptyTitle="No Warehouse Receipts Found"
        emptyWhy="No intake receipts match your search or filter."
        emptyNextStep="Record incoming cargo from a customer or shipper to add it to the consolidation queue."
        emptyActionLabel="Create Warehouse Receipt"
        onEmptyAction={() => onNavigate('warehouse-receipts', 'create')}
        onRowClick={(item) => onNavigate('warehouse-receipts', item.id)}
      />

      {/* 4x6 Roll Label Print Modal */}
      <CargoLabelModal
        isOpen={!!labelCargo}
        onClose={() => setLabelCargo(null)}
        cargo={labelCargo}
      />

      {/* Edit Modal */}
      <WarehouseReceiptModal
        isOpen={!!editingReceipt}
        receipt={editingReceipt}
        onClose={() => setEditingReceipt(null)}
        onSave={async (updates) => {
          await updateWarehouseReceipt(editingReceipt.id, updates);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingReceipt}
        onClose={() => setDeletingReceipt(null)}
        itemName={deletingReceipt?.receiptNumber}
        itemType="Warehouse Receipt"
        onConfirm={async () => {
          await deleteWarehouseReceipt(deletingReceipt.id);
        }}
      />
    </div>
  );
};

