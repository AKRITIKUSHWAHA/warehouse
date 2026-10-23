import React, { useState, useEffect } from 'react';
import { billOfLadingService } from '../../services/billOfLadingService';
import { PageHeader } from '../../components/common/PageHeader';
import { MasterBLViewer } from '../../components/documents/MasterBLViewer';
import { HoldAlertBanner } from '../../components/common/HoldAlertBanner';
import { ClearHoldModal } from '../../components/modals/ClearHoldModal';
import { PlaceHoldModal } from '../../components/modals/PlaceHoldModal';
import { BillOfLadingModal } from '../../components/modals/BillOfLadingModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import {
  FileText,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  Ship,
  Printer,
  Download,
  Edit2,
  Trash2,
  Layers,
  ExternalLink,
  Package,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';

export const BillOfLadingDetail = ({ blId, onNavigate }) => {
  const { billsOfLading, houseBills, consolidations = [], clearBLHold, placeBLHold, updateBillOfLading, deleteBillOfLading, generateManifestFromMasterBL } = useAppData();
  const { isAgent } = useAuth();
  const { showToast } = useToast();

  const [showClearModal, setShowClearModal] = useState(false);
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isGeneratingManifest, setIsGeneratingManifest] = useState(false);

  const [liveBL, setLiveBL] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (blId) {
      billOfLadingService.getBillOfLadingById(blId)
        .then(data => {
          if (isMounted && data) {
            setLiveBL(data);
          }
        })
        .catch(err => console.warn('Could not load live B/L details:', err));
    }
    return () => { isMounted = false; };
  }, [blId]);

  const bl = liveBL || billsOfLading.find(b => b.id === blId || b.blNumber === blId);

  if (!bl) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h3>Bill of Lading Not Found</h3>
        <button onClick={() => onNavigate('bills-of-lading')} className="btn btn-primary btn-sm mt-4">
          Back to B/L List
        </button>
      </div>
    );
  }

  const isOnHold = bl.status === 'On Hold' || bl.holdDetails?.isOnHold;

  // Retrieve linked House Bills: prefer live database relations if present
  const linkedHbls = (bl.linkedHouseBills && bl.linkedHouseBills.length > 0)
    ? bl.linkedHouseBills
    : houseBills.filter(
        h => bl.houseBillIds?.includes(h.id) || bl.houseBillIds?.includes(h.hblNumber) || h.assignedMasterBLId === bl.id || h.assignedMasterBLId === bl.blNumber
      );

  const handleOneClickManifest = async () => {
    if (isOnHold) {
      const confirmOnHold = window.confirm(
        `Notice: Master B/L ${bl.blNumber} is currently ON HOLD (${bl.holdDetails?.reason || 'Hold active'}).\n\nA manifest can still be generated for customs review, but it will be flagged as "Subject to B/L Hold". Proceed?`
      );
      if (!confirmOnHold) return;
    }

    try {
      setIsGeneratingManifest(true);
      showToast(`Generating Shipping Manifest from Master B/L ${bl.blNumber}...`, 'info', '1-Click Manifest');
      const newManifest = await generateManifestFromMasterBL(bl.id || bl.blNumber);
      if (newManifest) {
        showToast(`Manifest ${newManifest.manifestNumber || newManifest.id} generated in 1 click!`, 'success', 'Manifest Created');
        onNavigate('manifests', newManifest.id || newManifest.manifestNumber);
      }
    } catch (err) {
      console.error('Failed to generate manifest from Master B/L:', err);
      showToast(err?.message || 'Error generating manifest', 'error', 'Manifest Failed');
    } finally {
      setIsGeneratingManifest(false);
    }
  };

  const linkedConsolidation = (consolidations || []).find(c =>
    c.id === bl.consolidationId ||
    c.consolidationNumber === bl.consolidationId ||
    c.id === bl.consolidationNumber ||
    c.consolidationNumber === bl.consolidationNumber
  );
  const displayConsolidationNumber = bl.consolidationNumber || linkedConsolidation?.consolidationNumber || (bl.consolidationId && !bl.consolidationId.includes('-4') && !bl.consolidationId.includes('-2e35') ? bl.consolidationId : 'CNS-2026-487');

  return (
    <div className="bl-detail-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <PageHeader
          title={`Master Bill of Lading ${bl.blNumber}`}
          subtitle={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
              <span>Consigned to {bl.consignee?.name || bl.consignee} via {bl.oceanVessel} ({bl.portOfDischarge})</span>
              {(bl.consolidationNumber || bl.consolidationId || linkedConsolidation) && (
                <span
                  onClick={() => onNavigate('consolidations', linkedConsolidation?.id || linkedConsolidation?.consolidationNumber || bl.consolidationId)}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#0369A1',
                    background: '#E0F2FE',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="View linked Consolidation"
                >
                  <Layers size={12} />
                  <span>Consolidation: {displayConsolidationNumber}</span>
                </span>
              )}
            </div>
          }
          icon={FileText}
          breadcrumbs={[
            { label: 'Bills of Lading', href: '#' },
            { label: bl.blNumber }
          ]}
          actions={
            <button
              onClick={() => onNavigate('bills-of-lading')}
              className="btn btn-outline btn-sm"
              title="Back to Bills of Lading"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
          }
        />

        {/* Primary Workflow Journey Indicator */}
        <WorkflowIndicator currentStage="bills-of-lading" onStageClick={(stageId) => onNavigate(stageId)} />

        {/* Cancelled B/L Banner */}
        {bl.status === 'Cancelled' && (
          <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569' }}>
            <AlertTriangle size={20} style={{ color: '#64748B', flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#0F172A' }}>Master B/L Cancelled &amp; Voided:</strong> This Bill of Lading has been cancelled and cannot be cleared, released or dispatched for delivery.
            </div>
          </div>
        )}

        {/* Prominent Hold Warning Banner */}
        {isOnHold && (
          <HoldAlertBanner
            blNumber={bl.blNumber}
            holdDetails={bl.holdDetails}
            onClearHoldClick={() => setShowClearModal(true)}
          />
        )}
      </div>

      {/* Authentic Master B/L Document Layout */}
      <MasterBLViewer bl={bl} linkedHbls={linkedHbls} onNavigate={onNavigate} />

      {/* Linked House Bills of Lading Explorer Card */}
      <div className="card no-print" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} style={{ color: '#2563EB' }} />
            <h3 style={{ fontSize: '1rem', color: '#0A192F', margin: 0 }}>
              Consolidated House Bills of Lading in this Master B/L ({linkedHbls.length})
            </h3>
          </div>
          <button
            onClick={() => onNavigate('house-bills')}
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.78rem' }}
          >
            + View / Manage House B/Ls
          </button>
        </div>

        {linkedHbls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B', fontSize: '0.85rem' }}>
            No individual House B/Ls linked directly. (FCL / Direct Carrier Booking)
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>House B/L #</th>
                  <th>Customer / Shipper</th>
                  <th>Consignee</th>
                  <th>Cargo Description</th>
                  <th>Linked WRs</th>
                  <th>Total Pieces</th>
                  <th>Gross Weight</th>
                  <th>Volume (CBM)</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {linkedHbls.map(hbl => (
                  <tr
                    key={hbl.id}
                    onClick={() => onNavigate('house-bills', hbl.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 800, color: '#2563EB', fontFamily: 'JetBrains Mono, monospace' }}>
                      {hbl.hblNumber}
                    </td>
                    <td>{hbl.customerName}</td>
                    <td>{typeof hbl.consignee === 'object' ? hbl.consignee.name : hbl.consignee}</td>
                    <td style={{ fontSize: '0.78rem', color: '#334155' }}>{hbl.cargoDescription}</td>
                    <td><strong style={{ color: '#D97706' }}>{hbl.warehouseReceiptIds?.length || 1}</strong> WRs</td>
                    <td style={{ fontWeight: 700 }}>{hbl.totalPieces || hbl.totalPackages} pcs</td>
                    <td>{hbl.totalWeightLbs?.toLocaleString()} lbs</td>
                    <td style={{ fontWeight: 700, color: '#0284C7' }}>{hbl.totalCbm} CBM</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('house-bills', hbl.id);
                        }}
                        className="btn btn-sm btn-ghost"
                        style={{ color: '#2563EB' }}
                      >
                        <ExternalLink size={13} />
                        <span className="hide-mobile">View HBL</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Master B/L Modal */}
      <BillOfLadingModal
        isOpen={showEditModal}
        bl={bl}
        isEdit={true}
        onClose={() => setShowEditModal(false)}
        onSave={async (updates) => {
          const updated = await updateBillOfLading(bl.id || bl.blNumber, updates);
          if (updated) setLiveBL(updated);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        itemName={bl.blNumber}
        itemType="Bill of Lading"
        onConfirm={async () => {
          await deleteBillOfLading(bl.id || bl.blNumber);
          onNavigate('bills-of-lading');
        }}
      />

      {/* Hold Modals */}
      <ClearHoldModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        bl={bl}
        onConfirm={async (id, notes) => {
          const updated = await clearBLHold(id || bl.id || bl.blNumber, notes);
          if (updated) setLiveBL(updated);
        }}
      />

      <PlaceHoldModal
        isOpen={showPlaceModal}
        onClose={() => setShowPlaceModal(false)}
        bl={bl}
        onConfirm={async (id, reason, notes) => {
          const updated = await placeBLHold(id || bl.id || bl.blNumber, reason, notes);
          if (updated) setLiveBL(updated);
        }}
      />
    </div>
  );
};
