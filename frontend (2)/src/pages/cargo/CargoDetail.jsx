import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CargoLabelModal } from '../../components/modals/CargoLabelModal';
import { CargoModal } from '../../components/modals/CargoModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { CargoLabel4x6 } from '../../components/documents/CargoLabel4x6';
import { BarcodeVisual, QrVisual } from '../../components/common/BarcodeVisual';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import { Box, ArrowLeft, Printer, Package, Layers, ShieldCheck, Edit2, Trash2 } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { cargoService } from '../../services/cargoService';

export const CargoDetail = ({ cargoId, onNavigate }) => {
  const { cargoItems, warehouseReceipts, updateCargo, deleteCargo } = useAppData();
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fetchedCargo, setFetchedCargo] = useState(null);

  const cargo = cargoItems.find(c => 
    String(c.id) === String(cargoId) || 
    c.id === cargoId || 
    c.cargoNumber === cargoId
  );

  useEffect(() => {
    if (!cargo && cargoId) {
      cargoService.getCargoById(cargoId).then(data => {
        if (data) setFetchedCargo(data);
      }).catch(() => {});
    }
  }, [cargo, cargoId]);

  const activeCargo = cargo || fetchedCargo;

  const wr = warehouseReceipts.find(r => 
    (activeCargo?.warehouseReceiptId && (String(r.id) === String(activeCargo.warehouseReceiptId) || r.id === activeCargo.warehouseReceiptId)) || 
    (activeCargo?.receiptNumber && (String(r.receiptNumber) === String(activeCargo.receiptNumber) || r.receiptNumber === activeCargo.receiptNumber))
  );

  if (!activeCargo) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h3>Cargo Item Not Found</h3>
        <button onClick={() => onNavigate('cargo')} className="btn btn-primary btn-sm mt-4">
          Back to Cargo List
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title={`Cargo Unit ${activeCargo.cargoNumber || activeCargo.id}`}
        subtitle={`Associated with Warehouse Receipt ${activeCargo.receiptNumber} (${activeCargo.customer})`}
        icon={Box}
        breadcrumbs={[
          { label: 'Cargo Inventory', href: '#' },
          { label: activeCargo.cargoNumber || activeCargo.id }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('cargo')}
              className="btn btn-outline btn-sm"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
            <button
              onClick={() => setShowLabelModal(true)}
              className="btn btn-outline btn-sm"
            >
              <Printer size={15} />
              <span>Print 4x6 Label</span>
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="btn btn-secondary btn-sm"
            >
              <Edit2 size={15} />
              <span>Edit Cargo</span>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-danger btn-sm"
            >
              <Trash2 size={15} />
              <span>Delete Cargo</span>
            </button>
          </div>
        }
      />

      <WorkflowIndicator currentStage="cargo" onNavigate={onNavigate} />

      {/* Status + Next Step Banner (Prompt Section 14) */}
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
          borderLeft: '4px solid #0284C7',
          boxShadow: '0 1px 3px rgba(10, 25, 47, 0.05)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
            Current Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <StatusBadge status={activeCargo.status} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
              {activeCargo.id}
            </span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
            Next Step
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0284C7', marginTop: '2px' }}>
            {activeCargo.status === 'Ready for Consolidation'
              ? 'Ready for Operations Consolidation into ocean container'
              : activeCargo.status === 'Consolidated'
              ? `Packed in ocean box ${activeCargo.assignedConsolidationId || ''}`
              : 'Staged in warehouse CFS inventory'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {activeCargo.receiptNumber && (
            <button
              onClick={() => onNavigate('warehouse-receipts', activeCargo.receiptNumber)}
              className="btn btn-outline btn-sm"
            >
              <span>View Warehouse Receipt</span>
            </button>
          )}
          {activeCargo.status === 'Ready for Consolidation' && (
            <button
              onClick={() => onNavigate('consolidations', 'create')}
              className="btn btn-primary btn-sm"
            >
              <span>Build Consolidation</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left Column: Cargo Details Card (7 Cols) */}
        <div style={{ gridColumn: 'span 7' }} className="col-span-7-mobile">
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>CARGO IDENTIFIER</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
                  {activeCargo.id}
                </div>
              </div>
              <StatusBadge status={activeCargo.status} size="lg" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Customer</div>
                <div style={{ fontWeight: 700, color: '#0A192F', fontSize: '0.95rem' }}>{activeCargo.customer}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Warehouse Receipt</div>
                <button
                  onClick={() => onNavigate('warehouse-receipts', activeCargo.receiptNumber)}
                  style={{ fontWeight: 700, color: '#D97706', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.95rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  {activeCargo.receiptNumber}
                </button>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Description of Goods</div>
              <div style={{ fontSize: '0.9rem', color: '#1E293B', fontWeight: 500, marginTop: '2px' }}>{activeCargo.description}</div>
            </div>

            {/* Metrics Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }} className="grid-cols-3-mobile">
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>PACKAGES</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0A192F' }}>{activeCargo.packageCount} {activeCargo.packageType}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>GROSS WEIGHT</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0A192F' }}>{activeCargo.weightLbs} lbs</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>VOLUME (CFT / CBM)</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#D97706' }}>{activeCargo.cft || ((activeCargo.cbm || 0) * 35.3147).toFixed(1)} CFT <span style={{ color: '#0284C7', fontSize: '0.9rem', fontWeight: 600 }}>({activeCargo.cbm} CBM)</span></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Dimensions (L × W × H)</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {activeCargo.lengthInches || 0}" × {activeCargo.widthInches || 0}" × {activeCargo.heightInches || 0}"
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Destination Port</div>
                <div style={{ fontWeight: 700, color: '#0284C7', fontSize: '0.9rem' }}>{activeCargo.destinationPort || 'NAS - Nassau'}</div>
              </div>
            </div>

            {/* Barcode representation */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <BarcodeVisual value={activeCargo.barcode || activeCargo.id} height={45} showText={true} />
            </div>
          </div>
        </div>

        {/* Right Column: Exact 4x6 Roll Thermal Label Visual (5 Cols) */}
        <div style={{ gridColumn: 'span 5' }} className="col-span-5-mobile">
          <div className="card" style={{ padding: '1rem', background: '#F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>4" × 6" Thermal Roll Preview</div>
              <button
                onClick={() => setShowLabelModal(true)}
                className="btn btn-sm btn-outline"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
              >
                <Printer size={13} />
                <span>Print</span>
              </button>
            </div>

            <CargoLabel4x6 cargo={activeCargo} pieceIndex={1} totalPieces={activeCargo.packageCount || 1} />
          </div>
        </div>
      </div>

      <CargoLabelModal
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        cargo={activeCargo}
      />

      {/* Edit Cargo Modal */}
      <CargoModal
        isOpen={showEditModal}
        cargo={activeCargo}
        isEdit={true}
        onClose={() => setShowEditModal(false)}
        onSave={async (updates) => {
          await updateCargo(activeCargo.id, updates);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        itemName={activeCargo.id}
        itemType="Cargo Unit"
        onConfirm={async () => {
          await deleteCargo(activeCargo.id);
          onNavigate('cargo');
        }}
      />
    </div>
  );
};
