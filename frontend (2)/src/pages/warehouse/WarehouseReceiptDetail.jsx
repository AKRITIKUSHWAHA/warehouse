import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { WarehouseReceiptViewer } from '../../components/documents/WarehouseReceiptViewer';
import { CargoLabelModal } from '../../components/modals/CargoLabelModal';
import { WarehouseReceiptModal } from '../../components/modals/WarehouseReceiptModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import { Package, ArrowLeft, Printer, Layers, Edit2, Trash2, FileText, Loader } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { warehouseService } from '../../services/warehouseService';

export const WarehouseReceiptDetail = ({ receiptId, onNavigate }) => {
  const { warehouseReceipts, updateWarehouseReceipt, deleteWarehouseReceipt, refreshAll } = useAppData();
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fetchedReceipt, setFetchedReceipt] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const contextReceipt = warehouseReceipts.find(r => 
    String(r.id) === String(receiptId) || 
    String(r.receiptNumber) === String(receiptId) ||
    r.id === receiptId || 
    r.receiptNumber === receiptId
  );
  const receipt = fetchedReceipt || contextReceipt;

  useEffect(() => {
    let isMounted = true;
    if (receiptId) {
      if (!contextReceipt) setIsFetching(true);
      warehouseService.getReceiptById(receiptId)
        .then(res => {
          if (isMounted && res) {
            setFetchedReceipt(res);
          }
        })
        .catch(err => console.warn('[WarehouseReceiptDetail] Live fetch note:', err))
        .finally(() => {
          if (isMounted) setIsFetching(false);
        });
    }
    return () => { isMounted = false; };
  }, [receiptId]);

  if (isFetching && !receipt) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <Loader size={30} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#0284C7' }} />
        <p style={{ color: '#64748B' }}>Loading Warehouse Receipt {receiptId}...</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h3>Warehouse Receipt Not Found</h3>
        <p style={{ color: '#64748B', marginTop: '0.5rem' }}>The requested receipt {receiptId} does not exist in the database.</p>
        <button onClick={() => onNavigate('warehouse-receipts')} className="btn btn-primary btn-sm mt-4">
          Back to Receipts List
        </button>
      </div>
    );
  }

  return (
    <div className="wr-detail-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <PageHeader
          title={`Warehouse Receipt ${receipt.receiptNumber}`}
          subtitle={`Intake on ${receipt.date || new Date().toISOString().slice(0, 10)} for ${receipt.customerName || receipt.customer || receipt.consignee || 'General Cargo'} (${receipt.destinationPort || 'NAS'})`}
          icon={Package}
          breadcrumbs={[
            { label: 'Warehouse Receipts', href: '#' },
            { label: receipt.receiptNumber }
          ]}
          actions={
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => onNavigate('warehouse-receipts')}
                className="btn btn-outline btn-sm"
                id="btn-back-wr"
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>
              <button
                onClick={() => setShowLabelModal(true)}
                className="btn btn-primary btn-sm"
                id="btn-preview-label-wr"
              >
                <Printer size={15} />
                <span>Print 4x6 Label</span>
              </button>
              {!receipt.assignedHouseBillId && (
                <button
                  onClick={() => onNavigate('house-bills', 'create')}
                  className="btn btn-sm"
                  style={{ background: '#0284C7', color: '#FFFFFF', borderColor: '#0284C7' }}
                  id="btn-create-hbl-wr"
                >
                  <FileText size={15} />
                  <span>Prepare House B/L</span>
                </button>
              )}
              <button
                onClick={() => setShowEditModal(true)}
                className="btn btn-outline btn-sm"
                id="btn-edit-wr"
              >
                <Edit2 size={15} />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-danger btn-sm"
                id="btn-delete-wr"
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
              {receipt.status === 'Ready for Consolidation' && (
                <button
                  onClick={() => onNavigate('consolidations', 'create')}
                  className="btn btn-outline btn-sm"
                  id="btn-consolidate-wr"
                >
                  <Layers size={15} />
                  <span>Consolidate Cargo</span>
                </button>
              )}
            </div>
          }
        />

        <WorkflowIndicator currentStage="warehouse-receipts" onNavigate={onNavigate} />

        {/* Status + Next Step Card (Prompt Section 14) */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            borderLeft: '4px solid #D97706',
            boxShadow: '0 1px 3px rgba(10, 25, 47, 0.05)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Current Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <StatusBadge status={receipt.status} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
                {receipt.receiptNumber}
              </span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Next Step
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0284C7', marginTop: '2px' }}>
              {receipt.status === 'Ready for Consolidation'
                ? 'Ready for Operations Consolidation into ocean container'
                : receipt.status === 'Consolidated'
                ? `Consolidated in ${receipt.assignedConsolidationId || 'Ocean Box'}`
                : 'Staged in CFS warehouse awaiting assignment'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {!receipt.assignedHouseBillId && (
              <button
                onClick={() => onNavigate('house-bills', 'create')}
                className="btn btn-sm btn-outline"
                style={{ borderColor: '#0284C7', color: '#0284C7' }}
                id="btn-next-step-hbl"
              >
                <FileText size={14} />
                <span>Prepare House B/L</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('cargo')}
              className="btn btn-outline btn-sm"
              id="btn-view-cargo-inv"
            >
              <span>View in Cargo Inventory</span>
            </button>
            {receipt.status === 'Ready for Consolidation' && (
              <button
                onClick={() => onNavigate('consolidations', 'create')}
                className="btn btn-primary btn-sm"
                id="btn-build-consolidation"
              >
                <span>Build Consolidation</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Document Layout */}
      <WarehouseReceiptViewer receipt={receipt} onNavigate={onNavigate} />

      {/* 4x6 Roll Label Preview & Print Modal */}
      <div className="no-print">
        <CargoLabelModal
          isOpen={showLabelModal}
          onClose={() => setShowLabelModal(false)}
          cargo={receipt}
        />

        {/* Edit Modal */}
        <WarehouseReceiptModal
          isOpen={showEditModal}
          receipt={receipt}
          onClose={() => setShowEditModal(false)}
          onSave={async (updates) => {
            const res = await updateWarehouseReceipt(receipt.id || receipt.receiptNumber, updates);
            if (res) {
              setFetchedReceipt(res);
            }
            if (refreshAll) {
              await refreshAll();
            }
            setShowEditModal(false);
          }}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          itemName={receipt.receiptNumber}
          itemType="Warehouse Receipt"
          onConfirm={async () => {
            await deleteWarehouseReceipt(receipt.id || receipt.receiptNumber);
            onNavigate('warehouse-receipts');
          }}
        />
      </div>
    </div>
  );
};
