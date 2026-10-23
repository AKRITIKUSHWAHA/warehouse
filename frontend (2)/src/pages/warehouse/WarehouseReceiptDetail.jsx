import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { WarehouseReceiptViewer } from '../../components/documents/WarehouseReceiptViewer';
import { CargoLabelModal } from '../../components/modals/CargoLabelModal';
import { Package, ArrowLeft, Printer, Loader } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { warehouseService } from '../../services/warehouseService';

export const WarehouseReceiptDetail = ({ receiptId, onNavigate }) => {
  const { warehouseReceipts } = useAppData();
  const [showLabelModal, setShowLabelModal] = useState(false);
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
          subtitle={`Intake on ${receipt.date || new Date().toISOString().slice(0, 10)} for ${receipt.customerName || receipt.customer || 'General Cargo'}${receipt.destinationPort ? ` (${receipt.destinationPort})` : ''}`}
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
            </div>
          }
        />
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
      </div>
    </div>
  );
};
