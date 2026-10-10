import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { HouseBLViewer } from '../../components/documents/HouseBLViewer';
import { HouseBillModal } from '../../components/modals/HouseBillModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import {
  FileText,
  ArrowLeft,
  Edit2,
  Trash2,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Package,
  Building2,
  ExternalLink
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { canManageHolds } from '../../config/rolePermissions';
import { houseBillService } from '../../services/houseBillService';

export const HouseBillDetail = ({ hblId, onNavigate }) => {
  const { currentUser } = useAuth();
  const { houseBills, warehouseReceipts, updateHouseBill, deleteHouseBill, placeHBLHold, clearHBLHold } = useAppData();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [liveHbl, setLiveHbl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    houseBillService.getHouseBillById(hblId).then(res => {
      if (isMounted && res) {
        setLiveHbl(res);
      }
    }).catch(err => {
      console.warn('Live fetch for house bill failed:', err);
    });
    return () => { isMounted = false; };
  }, [hblId]);

  const hbl = liveHbl || houseBills.find(h => h.id === hblId || h.hblNumber === hblId);

  if (!hbl) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h3>House Bill of Lading Not Found</h3>
        <button onClick={() => onNavigate('house-bills')} className="btn btn-primary btn-sm mt-4">
          Back to House B/L List
        </button>
      </div>
    );
  }

  const isOnHold = hbl.status === 'On Hold' || hbl.holdDetails?.isOnHold;

  // Retrieve full linked Warehouse Receipts
  const linkedWrs = warehouseReceipts.filter(
    w => hbl.warehouseReceiptIds?.includes(w.id) || hbl.warehouseReceiptIds?.includes(w.receiptNumber)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="no-print">
        <PageHeader
          title={`House Bill of Lading ${hbl.hblNumber}`}
          subtitle={`Issued for ${hbl.customerName} (${hbl.destinationPort})`}
          icon={FileText}
          breadcrumbs={[
            { label: 'House Bills of Lading', href: '#' },
            { label: hbl.hblNumber }
          ]}
          actions={
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => onNavigate('house-bills')} className="btn btn-outline btn-sm">
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>

              {canManageHolds(currentUser?.roleKey) && (
                isOnHold ? (
                  <button
                    onClick={async () => {
                      await clearHBLHold(hbl.id || hbl.hblNumber, 'Hold cleared by user');
                    }}
                    className="btn btn-success btn-sm"
                  >
                    <CheckCircle2 size={15} />
                    <span>Clear Hold &amp; Release</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      await placeHBLHold(hbl.id || hbl.hblNumber, 'Administrative Hold', 'Pending verification');
                    }}
                    className="btn btn-warning btn-sm"
                  >
                    <AlertTriangle size={15} />
                    <span>Place Hold</span>
                  </button>
                )
              )}

              {!hbl.assignedConsolidationId && (
                <button
                  onClick={() => onNavigate('consolidations', 'create')}
                  className="btn btn-primary btn-sm"
                >
                  <Layers size={15} />
                  <span>Consolidate House B/L</span>
                </button>
              )}

              <button onClick={() => setShowEditModal(true)} className="btn btn-secondary btn-sm">
                <Edit2 size={15} />
                <span>Edit HBL</span>
              </button>
              <button onClick={() => setShowDeleteModal(true)} className="btn btn-danger btn-sm">
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            </div>
          }
        />
      </div>

      {/* Main Document Layout */}
      <HouseBLViewer hbl={hbl} onNavigate={onNavigate} />

      {/* Linked Warehouse Receipts Explorer Card */}
      <div className="card no-print" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={18} style={{ color: '#D97706' }} />
            <h3 style={{ fontSize: '0.95rem', color: '#0A192F', margin: 0 }}>
              Linked Warehouse Receipts in this House B/L ({linkedWrs.length})
            </h3>
          </div>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>WR Number</th>
                <th>Intake Date</th>
                <th>Cargo Description</th>
                <th>Package Lines</th>
                <th>Total Pieces</th>
                <th>Weight</th>
                <th>Volume (CFT / CBM)</th>
                <th style={{ textAlign: 'right' }}>Open Record</th>
              </tr>
            </thead>
            <tbody>
              {linkedWrs.map(wr => (
                <tr
                  key={wr.id}
                  onClick={() => onNavigate('warehouse-receipts', wr.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 800, color: '#D97706', fontFamily: 'JetBrains Mono, monospace' }}>
                    {wr.receiptNumber || wr.receipt_number}
                  </td>
                  <td>{wr.date}</td>
                  <td>{wr.cargoDescription || wr.cargo_description}</td>
                  <td>{wr.packages?.length || wr.packageCount} lines</td>
                  <td style={{ fontWeight: 700 }}>{wr.totalPieces || wr.total_pieces || wr.packageCount} pcs</td>
                  <td>{(Number(wr.weightLbs || wr.weight_lbs || 0)).toLocaleString()} lbs</td>
                  <td style={{ fontWeight: 700, color: '#D97706' }}>{Number(wr.totalCft || wr.total_cft || wr.cft || 0)} CFT <span style={{ color: '#0284C7', fontWeight: 600 }}>({Number(wr.totalCbm || wr.total_cbm || wr.cbm || 0)} CBM)</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('warehouse-receipts', wr.id);
                      }}
                      className="btn btn-sm btn-ghost"
                      style={{ color: '#0284C7' }}
                    >
                      <ExternalLink size={13} />
                      <span className="hide-mobile">View WR</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <HouseBillModal
        isOpen={showEditModal}
        hbl={hbl}
        onClose={() => setShowEditModal(false)}
        onSave={async (updates) => {
          await updateHouseBill(hbl.id, updates);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        itemName={hbl.hblNumber}
        itemType="House Bill of Lading"
        onConfirm={async () => {
          await deleteHouseBill(hbl.id);
          onNavigate('house-bills');
        }}
      />
    </div>
  );
};
