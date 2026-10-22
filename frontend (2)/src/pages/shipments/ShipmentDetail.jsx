import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { HoldAlertBanner } from '../../components/common/HoldAlertBanner';
import { MasterBLViewer } from '../../components/documents/MasterBLViewer';
import { CargoLabelModal } from '../../components/modals/CargoLabelModal';
import { ClearHoldModal } from '../../components/modals/ClearHoldModal';
import { PlaceHoldModal } from '../../components/modals/PlaceHoldModal';
import { ShipmentModal } from '../../components/modals/ShipmentModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import {
  Ship,
  ArrowLeft,
  Package,
  FileText,
  Box,
  Compass,
  Activity,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Anchor,
  FileStack,
  Edit2,
  Trash2,
  Lock,
  Check
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { shipmentService } from '../../services/shipmentService';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';

export const ShipmentDetail = ({ shipmentId, onNavigate }) => {
  const { currentUser } = useAuth();
  const { shipments, warehouseReceipts, billsOfLading, consolidations, updateConsolidation, auditLogs, clearBLHold, placeBLHold, updateShipment, deleteShipment } = useAppData();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCargoForLabel, setSelectedCargoForLabel] = useState(null);
  const [showClearHoldModal, setShowClearHoldModal] = useState(false);
  const [showPlaceHoldModal, setShowPlaceHoldModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [liveShipment, setLiveShipment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (shipmentId) {
      setIsLoading(true);
      shipmentService.getShipmentById(shipmentId)
        .then(res => {
          if (isMounted && res) {
            setLiveShipment(res);
          }
        })
        .catch(err => console.warn('[ShipmentDetail] Live fetch note:', err))
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }
    return () => { isMounted = false; };
  }, [shipmentId]);

  const activeShipment = liveShipment || shipments.find(s => s.id === shipmentId || s.shipmentNumber === shipmentId || s.trackingNumber === shipmentId);
  const shipment = activeShipment;

  if (!shipment && isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h3>Loading Shipment...</h3>
        <p style={{ color: '#64748B' }}>Fetching live shipment data from database...</p>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h3>Shipment Not Found</h3>
        <button onClick={() => onNavigate('shipments')} className="btn btn-primary btn-sm mt-4">
          Back to Shipments List
        </button>
      </div>
    );
  }

  // Linked entities
  const linkedReceipts = (shipment.linkedReceipts && shipment.linkedReceipts.length > 0)
    ? shipment.linkedReceipts
    : warehouseReceipts.filter(r =>
        shipment.warehouseReceiptIds?.includes(r.id) || 
        shipment.warehouseReceiptIds?.includes(r.receiptNumber) || 
        r.assignedShipmentId === shipment.id ||
        r.assignedShipmentId === shipment.shipmentNumber
      );
  const linkedBL = shipment.linkedBL || billsOfLading.find(b => 
    b.id === shipment.billOfLadingId || 
    b.blNumber === shipment.billOfLadingNumber || 
    b.shipmentId === shipment.id ||
    b.shipmentId === shipment.shipmentNumber
  );

  const isHoldActive = linkedBL?.status === 'On Hold' || linkedBL?.holdDetails?.isOnHold || shipment.blStatus === 'On Hold';

  // Completely Dynamic Milestone Progression System (No hardcoded data)
  const MILESTONE_STAGES = [
    {
      key: 'Cargo Received',
      label: 'Cargo Received',
      icon: Package,
      actionBtn: null,
      color: '#0284C7',
      generateNotes: (s, u) => `Cargo received and staged at ${s.origin || 'origin facility'}. Verified by ${u?.name || 'Warehouse Staff'}.`,
      getLocation: (s) => s.origin || 'Origin CFS Facility'
    },
    {
      key: 'Consolidated',
      label: 'Consolidated',
      icon: Box,
      actionBtn: 'Mark as Consolidated',
      color: '#0284C7',
      generateNotes: (s, u) => `Cargo consolidated for destination port ${s.destinationPort || s.destination || 'assigned port'}. Staged by ${u?.name || 'Operations Staff'}.`,
      getLocation: (s) => s.origin || 'Consolidation Hub'
    },
    {
      key: 'Loaded & Sealed',
      label: 'Loaded & Sealed',
      icon: Lock,
      actionBtn: 'Mark Container as Loaded & Sealed',
      color: '#0284C7',
      generateNotes: (s, u) => `Container ${s.containerNumber || 'assigned unit'} stuffed and secured with Bolt Seal ${s.sealNumber || 'verified'}. Verified by ${u?.name || 'Warehouse Staff'}.`,
      getLocation: (s) => s.origin || 'Port of Loading'
    },
    {
      key: 'In Transit',
      label: 'In Transit',
      icon: Ship,
      actionBtn: 'Mark as In Transit (Departed)',
      color: '#16A34A',
      generateNotes: (s, u) => `Vessel ${s.vesselName || 'Ocean Vessel'} departed from ${s.origin || 'origin port'}. Sailing to ${s.destinationPort || 'destination'}. Carrier: ${s.carrier || 'Ocean Line'}. Logged by ${u?.name || 'Operations'}.`,
      getLocation: (s) => s.vesselName || 'Ocean Vessel'
    },
    {
      key: 'Arrived at Port',
      label: 'Arrived at Port',
      icon: Anchor,
      actionBtn: 'Mark as Arrived at Port (Discharged)',
      color: '#D97706',
      generateNotes: (s, u) => `Vessel docked at ${s.destinationPort || 'discharge port'}. Container discharged and transferred to terminal handling for ${s.agentName || 'assigned port agent'}. Logged by ${u?.name || 'Port Agent'}.`,
      getLocation: (s) => s.destinationPort || 'Destination Port'
    },
    {
      key: 'Delivered / Released',
      label: 'Delivered / Released',
      icon: CheckCircle2,
      actionBtn: 'Mark as Delivered / Released',
      color: '#059669',
      generateNotes: (s, u) => `Cargo cleared customs and released for final consignee delivery under B/L ${s.billOfLadingNumber || linkedBL?.blNumber || 'Master B/L'}. Verified by ${u?.name || 'Authorized Staff'}.`,
      getLocation: (s) => s.destinationPort || 'Consignee Terminal'
    }
  ];

  // Dynamically determine current stage index and next available milestone
  const currentStageIndex = MILESTONE_STAGES.findIndex(
    m => m.key.toLowerCase() === (shipment.status || '').toLowerCase()
  );
  const nextMilestone = currentStageIndex !== -1 && currentStageIndex + 1 < MILESTONE_STAGES.length
    ? MILESTONE_STAGES[currentStageIndex + 1]
    : (!shipment.status || shipment.status === 'Booked' ? MILESTONE_STAGES[0] : null);

  const handleAdvanceToStage = async (targetStageKey) => {
    if (!shipment || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const targetStageConfig = MILESTONE_STAGES.find(m => m.key === targetStageKey) || {
        key: targetStageKey,
        getLocation: (s) => s.currentLocation || s.origin || 'Facility',
        generateNotes: (s, u) => `Milestone ${targetStageKey} completed by ${u?.name || 'Staff'}.`
      };
      const targetStageIndex = MILESTONE_STAGES.findIndex(m => m.key === targetStageKey);

      // Existing checkpoints or dynamic defaults generated from actual shipment attributes
      const currentList = Array.isArray(shipment.trackingCheckpoints) && shipment.trackingCheckpoints.length > 0
        ? [...shipment.trackingCheckpoints]
        : MILESTONE_STAGES.map((stg, i) => ({
            id: `chk-${Date.now()}-${i + 1}`,
            stage: stg.key,
            status: i === 0 ? 'Completed' : 'Pending',
            date: i <= 1 ? (shipment.createdDate || todayStr) : (i <= 3 ? (shipment.etd || todayStr) : (shipment.eta || todayStr)),
            time: i === 0 ? '08:30 AM' : (i === 1 ? '10:00 AM' : '12:00 PM'),
            location: stg.getLocation(shipment),
            notes: stg.generateNotes(shipment, currentUser)
          }));

      // Update checkpoints dynamically
      const updatedCheckpoints = currentList.map(chk => {
        const stageIdx = MILESTONE_STAGES.findIndex(m => m.key.toLowerCase() === chk.stage.toLowerCase());
        const stageConfig = MILESTONE_STAGES[stageIdx] || targetStageConfig;

        if (stageIdx !== -1 && targetStageIndex !== -1 && stageIdx < targetStageIndex) {
          return {
            ...chk,
            status: 'Completed',
            date: chk.date || todayStr
          };
        } else if (chk.stage.toLowerCase() === targetStageKey.toLowerCase()) {
          return {
            ...chk,
            status: 'Completed',
            date: todayStr,
            time: timeStr,
            location: stageConfig.getLocation(shipment),
            notes: stageConfig.generateNotes(shipment, currentUser)
          };
        }
        return chk;
      });

      const newLocation = targetStageConfig.getLocation(shipment);
      const updates = {
        status: targetStageKey,
        currentLocation: newLocation,
        trackingCheckpoints: updatedCheckpoints
      };

      const targetId = shipment.id || shipment.shipmentNumber;
      await updateShipment(targetId, updates);

      // Dynamically sync linked consolidation status
      const linkedConsolidation = (consolidations || []).find(c =>
        c.id === shipment.consolidationId ||
        c.consolidationNumber === shipment.consolidationId ||
        c.assignedShipmentId === shipment.id ||
        c.assignedShipmentId === shipment.shipmentNumber
      );
      if (updateConsolidation && linkedConsolidation?.id) {
        try {
          await updateConsolidation(linkedConsolidation.id, {
            ...linkedConsolidation,
            status: targetStageKey
          });
        } catch (cnsErr) {
          console.warn('[ShipmentDetail] Consolidation sync notice:', cnsErr);
        }
      }

      setLiveShipment(prev => ({
        ...(prev || shipment),
        ...updates
      }));
    } catch (err) {
      console.error(`[ShipmentDetail] Failed to advance stage to ${targetStageKey}:`, err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader
        title={`Shipment ${shipment.shipmentNumber}`}
        subtitle={`${shipment.origin || 'Port of Miami (USMIA)'} → ${shipment.destinationPort || 'Port of Charlotte Amalie (STT)'}${shipment.vesselName ? ` via ${shipment.vesselName}` : ''}`}
        icon={Ship}
        breadcrumbs={[
          { label: 'Shipments', href: '#' },
          { label: shipment.shipmentNumber }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
            <button
              onClick={() => onNavigate('shipments')}
              className="btn btn-outline btn-sm"
              title="Back to Shipments List"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <button
              onClick={() => onNavigate('tracking', shipment.trackingNumber)}
              className="btn btn-outline btn-sm"
              title="Track Live Cargo Location"
            >
              <Compass size={14} />
              <span>Live Tracking</span>
            </button>

            {/* Completely Dynamic 1-Click Action Button for Current Next Milestone */}
            {nextMilestone && nextMilestone.actionBtn && (
              <button
                onClick={() => handleAdvanceToStage(nextMilestone.key)}
                disabled={isUpdatingStatus}
                className="btn btn-sm btn-primary"
                style={{
                  background: nextMilestone.key === 'In Transit'
                    ? 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)'
                    : nextMilestone.key === 'Arrived at Port'
                    ? 'linear-gradient(135deg, #D97706 0%, #B45309 100%)'
                    : nextMilestone.key === 'Delivered / Released'
                    ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                    : 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.12)',
                  cursor: isUpdatingStatus ? 'not-allowed' : 'pointer'
                }}
                title={`1-Click: Advance shipment to ${nextMilestone.key}`}
              >
                {React.createElement(nextMilestone.icon, { size: 14 })}
                <span>{isUpdatingStatus ? 'Updating...' : nextMilestone.actionBtn}</span>
              </button>
            )}

            <button
              onClick={() => setShowEditModal(true)}
              className="btn btn-secondary btn-sm"
              title="Edit Shipment Parameters"
            >
              <Edit2 size={14} />
              <span>Edit Shipment</span>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-danger btn-sm"
              title="Delete Shipment Record"
            >
              <Trash2 size={14} />
              <span>Delete Shipment</span>
            </button>
            {linkedBL && (
              <button
                onClick={() => onNavigate('bills-of-lading', linkedBL.id)}
                className="btn btn-primary btn-sm"
                title="Open Master Bill of Lading"
              >
                <FileText size={14} />
                <span>View Master B/L</span>
              </button>
            )}
          </div>
        }
      />

      {/* Primary Workflow Journey Indicator */}
      <WorkflowIndicator currentStage="shipments" onStageClick={(stageId) => onNavigate(stageId)} />

      {/* Status + Next Step Action Guide */}
      <div className="no-print" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1rem 1.25rem',
        background: shipment.status === 'Delivered / Released' ? '#F0FDF4' : '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderLeft: `4px solid ${nextMilestone?.color || '#0284C7'}`,
        borderRadius: '10px',
        boxShadow: '0 1px 3px rgba(10, 25, 47, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{
            background: '#0F172A',
            color: '#FFFFFF',
            borderRadius: '6px',
            padding: '0.35rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38BDF8' }} />
            CURRENT STATUS: {shipment.status?.toUpperCase() || 'BOOKED'}
          </div>
          <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
            {nextMilestone
              ? `Next Action: Click "${nextMilestone.actionBtn}" to advance shipment to ${nextMilestone.label}.`
              : 'All shipping milestones completed. Consignment cleared & delivered.'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {nextMilestone && nextMilestone.actionBtn && (
            <button
              onClick={() => handleAdvanceToStage(nextMilestone.key)}
              disabled={isUpdatingStatus}
              className="btn btn-sm btn-primary"
              style={{
                fontSize: '0.825rem',
                padding: '0.45rem 0.85rem',
                background: nextMilestone.color || '#0284C7',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: isUpdatingStatus ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
              }}
            >
              {React.createElement(nextMilestone.icon, { size: 14 })}
              <span>{isUpdatingStatus ? 'Updating...' : nextMilestone.actionBtn}</span>
            </button>
          )}
          {linkedBL ? (
            <button
              onClick={() => onNavigate('bills-of-lading', linkedBL.id)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem', fontWeight: 600 }}
            >
              Review Master B/L &rarr;
            </button>
          ) : (
            <button
              onClick={() => onNavigate('bills-of-lading')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem', fontWeight: 600 }}
            >
              View Bills of Lading &rarr;
            </button>
          )}
          <button
            onClick={() => onNavigate('manifests')}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem', background: '#FFFFFF', fontWeight: 600 }}
          >
            Create Manifest
          </button>
        </div>
      </div>

      {/* Prominent B/L Hold Warning if On Hold */}
      {isHoldActive && linkedBL && (
        <HoldAlertBanner
          blNumber={linkedBL.blNumber}
          holdDetails={linkedBL.holdDetails}
          onClearHoldClick={() => setShowClearHoldModal(true)}
        />
      )}

      {/* Shipment Status & Highlights Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tracking Reference</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0284C7', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                {shipment.trackingNumber || `TRK-VI-${shipment.shipmentNumber?.replace(/\D/g, '') || '0001'}`}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '1.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>Current Stage</div>
              <StatusBadge status={shipment.status} size="lg" />
            </div>

            <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '1.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>Master B/L Status</div>
              <StatusBadge status={linkedBL?.status || shipment.blStatus || 'Draft'} size="lg" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.825rem', background: '#F8FAFC', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} style={{ color: '#64748B' }} />
              <span style={{ color: '#64748B' }}>ETD (Dep):</span>
              <strong style={{ color: '#0A192F' }}>{shipment.etd || new Date().toISOString().split('T')[0]}</strong>
            </div>
            <div style={{ borderLeft: '1px solid #CBD5E1', paddingLeft: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Anchor size={14} style={{ color: '#0284C7' }} />
              <span style={{ color: '#64748B' }}>ETA (Arr):</span>
              <strong style={{ color: '#0284C7' }}>{shipment.eta || '2026-10-28'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        className="tabs-container"
        style={{
          display: 'flex',
          gap: '0.35rem',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          flexWrap: 'nowrap',
          borderBottom: '2px solid #E2E8F0'
        }}
      >
        {[
          { id: 'overview', label: 'Overview', icon: Ship },
          { id: 'cargo', label: `Cargo Items (${linkedReceipts.length})`, icon: Package },
          { id: 'bl', label: 'Master Bill of Lading', icon: FileText },
          { id: 'container', label: 'Container Details', icon: Box },
          { id: 'documents', label: 'Documents', icon: FileStack },
          { id: 'tracking', label: 'Tracking Checkpoints', icon: Compass },
          { id: 'activity', label: 'Activity & Audit', icon: Activity }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-12 gap-5">
          <div style={{ gridColumn: 'span 8' }} className="col-span-8-mobile">
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#0A192F', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', margin: 0 }}>
                Shipment Profile &amp; Route Logistics
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Port of Loading (Origin)</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0A192F', marginTop: '2px' }}>
                    {shipment.origin || 'Port of Miami (USMIA)'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Port of Discharge (Destination)</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0284C7', marginTop: '2px' }}>
                    {shipment.destinationPort || 'Port of Charlotte Amalie (STT)'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Ocean Vessel</div>
                  <div style={{ fontWeight: 700, color: '#0A192F', marginTop: '2px' }}>
                    {shipment.vesselName || 'M/V Tropic Island (Feeder Boat)'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Ocean Carrier</div>
                  <div style={{ fontWeight: 700, color: '#0A192F', marginTop: '2px' }}>
                    {shipment.carrier || 'Tropical Shipping Line'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Container Number</div>
                  <div style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#0A192F', marginTop: '2px' }}>
                    {shipment.containerNumber || 'cn 102'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Bolt Seal Number</div>
                  <div style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#D97706', marginTop: '2px' }}>
                    {shipment.sealNumber || 'bsn 101'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Assigned Port Agent</div>
                  <div style={{ fontWeight: 700, color: '#0A192F', marginTop: '2px' }}>
                    {shipment.agentName || 'VI Customs St. Thomas Agency'}
                  </div>
                </div>
              </div>

              {/* Total Aggregate Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }} className="grid-cols-4-mobile">
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderTop: '3px solid #0A192F', padding: '0.85rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>PACKAGES</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0A192F', marginTop: '4px' }}>
                    {shipment.totalPackages || 1}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Consolidated items</div>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderTop: '3px solid #475569', padding: '0.85rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>GROSS WEIGHT</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0A192F', marginTop: '4px' }}>
                    {(Number(shipment.totalWeightLbs) || 45).toLocaleString()} lbs
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                    ~{((Number(shipment.totalWeightLbs) || 45) * 0.453592).toFixed(1)} kg
                  </div>
                </div>
                <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderTop: '3px solid #0284C7', padding: '0.85rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#0369A1', fontWeight: 800, textTransform: 'uppercase' }}>VOLUME (CBM)</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0284C7', marginTop: '4px' }}>
                    {shipment.totalCbm || '0.12'} CBM
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#0284C7' }}>Metric volume</div>
                </div>
                <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderTop: '3px solid #D97706', padding: '0.85rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#92400E', fontWeight: 800, textTransform: 'uppercase' }}>VOLUME (CFT)</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#D97706', marginTop: '4px' }}>
                    {shipment.totalCft || '4.17'} CFT
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#92400E' }}>Ocean freight cube</div>
                </div>
              </div>

              {/* Current Live Position */}
              <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)' }} />
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Current Cargo Position:</span>
                  <strong style={{ fontSize: '0.9rem', color: '#0A192F' }}>{shipment.currentLocation || 'Miami CFS Warehouse (Bay 2)'}</strong>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 600 }}>Staged for Feeder Vessel Loading</span>
              </div>
            </div>
          </div>

          <div style={{ gridColumn: 'span 4' }} className="col-span-4-mobile">
            <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#0A192F', margin: 0, borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                B/L &amp; Commercial Actions
              </h3>

              <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Master B/L:</span>
                  <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: '#0A192F', fontSize: '0.9rem' }}>
                    {linkedBL?.blNumber || shipment.billOfLadingNumber || 'BL-VI-2026-0001'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Status:</span>
                  <StatusBadge status={linkedBL?.status || shipment.blStatus || 'Draft'} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px dashed #CBD5E1' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Carrier:</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0A192F' }}>{shipment.carrier || 'Tropical Shipping Line'}</span>
                </div>
              </div>

              {/* Hold Controls Demo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {isHoldActive ? (
                  <button
                    onClick={() => setShowClearHoldModal(true)}
                    className="btn btn-success w-full"
                    style={{ justifyContent: 'center', fontWeight: 600 }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Authorize &amp; Clear Hold</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPlaceHoldModal(true)}
                    className="btn btn-danger w-full"
                    style={{ justifyContent: 'center', fontWeight: 600 }}
                  >
                    <AlertTriangle size={16} />
                    <span>Place B/L On Hold</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('bl')}
                  className="btn btn-outline w-full"
                  style={{ justifyContent: 'center', fontWeight: 600 }}
                >
                  <FileText size={16} />
                  <span>Open Master B/L Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CARGO ITEMS */}
      {activeTab === 'cargo' && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#0A192F' }}>
              Consolidated Warehouse Receipts ({linkedReceipts.length} Intake Lots)
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Customer</th>
                  <th>Description</th>
                  <th>Packages</th>
                  <th>Weight (LBS)</th>
                  <th>Volume (CFT / CBM)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {linkedReceipts.map(wr => (
                  <tr key={wr.id}>
                    <td style={{ fontWeight: 700, color: '#D97706', fontFamily: 'JetBrains Mono, monospace' }}>
                      {wr.receiptNumber}
                    </td>
                    <td style={{ fontWeight: 600 }}>{wr.customer}</td>
                    <td style={{ fontSize: '0.8rem' }}>{wr.cargoDescription}</td>
                    <td style={{ fontWeight: 600 }}>{wr.packageCount} {wr.packageType}</td>
                    <td>{wr.weightLbs} lbs</td>
                    <td style={{ fontWeight: 700, color: '#D97706' }}>{wr.cft} CFT <span style={{ color: '#0284C7', fontWeight: 600 }}>({wr.cbm} CBM)</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => setSelectedCargoForLabel(wr)}
                          className="btn btn-sm btn-outline"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          <Printer size={12} />
                          <span>4x6 Label</span>
                        </button>
                        <button
                          onClick={() => onNavigate('warehouse-receipts', wr.id || wr.receiptNumber)}
                          className="btn btn-sm btn-primary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          <span>Receipt</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER BILL OF LADING */}
      {activeTab === 'bl' && (
        <div>
          {linkedBL ? (
            <MasterBLViewer bl={linkedBL} />
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <FileText size={36} style={{ color: '#94A3B8' }} />
              <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>No B/L Attached</div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CONTAINER */}
      {activeTab === 'container' && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#0A192F', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
            Container Details
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Container Number</div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0A192F', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                {shipment.containerNumber || 'cn 102'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Bolt Seal Number</div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#D97706', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                {shipment.sealNumber || 'bsn 101'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Container Type</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0A192F', marginTop: '2px' }}>
                {shipment.containerType || '40ft High Cube Ocean Container'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#0A192F' }}>Associated Shipping Documents</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={20} style={{ color: '#0284C7' }} />
                <div>
                  <strong>Master Bill of Lading ({linkedBL?.blNumber || shipment.billOfLadingNumber})</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Official Master Document</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <StatusBadge status={linkedBL?.status || shipment.blStatus} />
                <button
                  onClick={() => setActiveTab('bl')}
                  className="btn btn-sm btn-primary"
                  disabled={isHoldActive}
                >
                  <Download size={13} />
                  <span>{isHoldActive ? 'Locked (On Hold)' : 'Download PDF'}</span>
                </button>
              </div>
            </div>

            {linkedReceipts.map(wr => (
              <div key={wr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Package size={20} style={{ color: '#D97706' }} />
                  <div>
                    <strong>Warehouse Receipt {wr.receiptNumber}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{wr.customer} • {wr.packageCount} {wr.packageType}</div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('warehouse-receipts', wr.id || wr.receiptNumber)}
                  className="btn btn-sm btn-outline"
                >
                  <span>View Receipt</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: TRACKING CHECKPOINTS */}
      {activeTab === 'tracking' && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#0A192F' }}>Live Milestones &amp; Tracking Checkpoints</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
              Tracking Reference: <strong>{shipment.trackingNumber}</strong>
            </p>
          </div>

          <div className="tracking-timeline">
            {(shipment.trackingCheckpoints || []).map((chk, idx) => (
              <div
                key={chk.id || idx}
                className={`timeline-item ${chk.status === 'Completed' ? 'completed' : chk.status === 'Active' ? 'active' : ''}`}
              >
                <div className="timeline-marker">
                  {chk.status === 'Completed' && <CheckCircle2 size={12} />}
                  {chk.status === 'Active' && <Anchor size={12} />}
                  {chk.status === 'Pending' && <Clock size={10} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="timeline-title">{chk.stage}</span>
                    {chk.status !== 'Completed' && (
                      <button
                        onClick={() => handleAdvanceToStage(chk.stage)}
                        disabled={isUpdatingStatus}
                        className="btn btn-sm"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.6rem',
                          background: chk.stage === 'In Transit' ? '#16A34A' : chk.stage === 'Arrived at Port' ? '#D97706' : chk.stage === 'Delivered / Released' ? '#059669' : '#0284C7',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: 600,
                          cursor: isUpdatingStatus ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {React.createElement(
                          chk.stage === 'In Transit' ? Ship : chk.stage === 'Loaded & Sealed' ? Lock : chk.stage === 'Arrived at Port' ? Anchor : CheckCircle2,
                          { size: 11 }
                        )}
                        <span>{isUpdatingStatus ? 'Updating...' : `1-Click: Mark ${chk.stage}`}</span>
                      </button>
                    )}
                  </div>
                  <span className="timeline-time">{chk.date} {chk.time ? `• ${chk.time}` : ''}</span>
                </div>

                {chk.location && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0284C7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {chk.location}
                  </div>
                )}

                <div className="timeline-desc">{chk.notes}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: ACTIVITY & AUDIT */}
      {activeTab === 'activity' && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#0A192F' }}>Shipment Activity Log</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem' }}>
            {/* Dynamic Live Milestone Events */}
            {(shipment.trackingCheckpoints || [])
              .filter(chk => chk.status === 'Completed' || chk.status === 'Active')
              .map((chk, i) => (
                <div key={chk.id || i} style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <strong>{chk.stage}</strong>: {chk.notes || `Milestone logged at ${chk.location || shipment.currentLocation || 'facility'}.`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                    {chk.date} {chk.time ? `• ${chk.time}` : ''}
                  </div>
                </div>
              ))}

            {isHoldActive && (
              <div style={{ padding: '0.75rem', background: '#FEF2F2', borderRadius: '6px', border: '1px solid #FECACA', color: '#991B1B' }}>
                <strong>B/L On Hold:</strong> {linkedBL?.holdDetails?.reason || 'Payment verification pending'}.
              </div>
            )}

            {/* Dynamic System Audit Entries */}
            {(auditLogs || [])
              .filter(a => a.entityId === shipment.id || a.entityId === shipment.shipmentNumber || a.details?.includes(shipment.shipmentNumber))
              .map(entry => (
                <div key={entry.id} style={{ padding: '0.75rem', background: '#F1F5F9', borderRadius: '6px', border: '1px solid #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <strong>{entry.action}</strong> by {entry.user || 'System'}: {entry.details}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {entry.timestamp}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <CargoLabelModal
        isOpen={!!selectedCargoForLabel}
        onClose={() => setSelectedCargoForLabel(null)}
        cargo={selectedCargoForLabel}
      />

      <ClearHoldModal
        isOpen={showClearHoldModal}
        onClose={() => setShowClearHoldModal(false)}
        bl={linkedBL}
        onConfirm={async (id, notes) => {
          await clearBLHold(id, notes);
        }}
      />

      <PlaceHoldModal
        isOpen={showPlaceHoldModal}
        onClose={() => setShowPlaceHoldModal(false)}
        bl={linkedBL}
        onConfirm={async (id, reason, notes) => {
          await placeBLHold(id, reason, notes);
        }}
      />

      {/* Edit Shipment Modal */}
      <ShipmentModal
        isOpen={showEditModal}
        shipment={shipment}
        isEdit={true}
        onClose={() => setShowEditModal(false)}
        onSave={async (updates) => {
          await updateShipment(shipment.id || shipment.shipmentNumber, updates);
          const refreshed = await shipmentService.getShipmentById(shipment.id || shipment.shipmentNumber);
          if (refreshed) setLiveShipment(refreshed);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        itemName={shipment.shipmentNumber}
        itemType="Shipment"
        onConfirm={async () => {
          await deleteShipment(shipment.id || shipment.shipmentNumber);
          onNavigate('shipments');
        }}
      />
    </div>
  );
};
