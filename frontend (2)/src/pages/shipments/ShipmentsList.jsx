import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShipmentModal } from '../../components/modals/ShipmentModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import {
  Ship,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Search,
  ArrowRight,
  Anchor,
  FileText,
  RefreshCw,
  MoreVertical,
  Box,
  Layers,
  Package,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const ShipmentsList = ({ onNavigate }) => {
  const {
    shipments = [],
    consolidations = [],
    createShipment,
    updateShipment,
    deleteShipment,
    fetchMenuApi
  } = useAppData();
  const { isAgent, currentUser } = useAuth();
  const { showToast } = useToast();

  // Navigation tabs: 'boxes' (Container boxes to ship) vs 'shipments' (Active ocean shipments)
  const [activeViewTab, setActiveViewTab] = useState('boxes');
  const [boxSearch, setBoxSearch] = useState('');
  const [selectedBoxIds, setSelectedBoxIds] = useState([]);
  const [selectedConsolForShipment, setSelectedConsolForShipment] = useState(null);

  const [editingShipment, setEditingShipment] = useState(null);
  const [deletingShipment, setDeletingShipment] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (fetchMenuApi) {
      fetchMenuApi('shipments');
    }
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (fetchMenuApi) await fetchMenuApi('shipments');
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filter if Agent
  const visibleShipments = useMemo(() => {
    if (isAgent) {
      return shipments.filter(s => {
        if (!currentUser?.agentId && !currentUser?.destinationPortCode) return true;
        if (currentUser?.agentId && s.agentId === currentUser.agentId) return true;
        if (currentUser?.destinationPortCode && s.destinationCode === currentUser.destinationPortCode) return true;
        return false;
      });
    }
    return shipments;
  }, [shipments, isAgent, currentUser]);

  const visibleConsolidations = useMemo(() => {
    if (isAgent) {
      return consolidations.filter(c => {
        if (!currentUser?.agentId && !currentUser?.destinationPortCode) return true;
        if (currentUser?.agentId && c.agentId === currentUser.agentId) return true;
        if (currentUser?.destinationPortCode && (c.destinationCode === currentUser.destinationPortCode || c.destinationPort?.includes(currentUser.destinationPortCode))) return true;
        return false;
      });
    }
    return consolidations;
  }, [consolidations, isAgent, currentUser]);

  // Find linked shipment for a consolidation
  const getLinkedShipment = (consol) => {
    return visibleShipments.find(s =>
      s.id === consol.assignedShipmentId ||
      s.shipmentNumber === consol.assignedShipmentId ||
      s.consolidationId === consol.id ||
      s.consolidationId === consol.consolidationNumber ||
      (consol.containerNumber && s.containerNumber === consol.containerNumber)
    );
  };

  // Filter container boxes based on search query
  const filteredBoxes = useMemo(() => {
    return visibleConsolidations.filter(c => {
      if (!boxSearch.trim()) return true;
      const q = boxSearch.toLowerCase();
      const num = (c.consolidationNumber || '').toLowerCase();
      const cont = (c.containerNumber || '').toLowerCase();
      const seal = (c.sealNumber || '').toLowerCase();
      const dest = (c.destinationPort || c.destinationCode || '').toLowerCase();
      const vsl = (c.vesselName || '').toLowerCase();
      const carr = (c.carrier || '').toLowerCase();
      return (
        num.includes(q) ||
        cont.includes(q) ||
        seal.includes(q) ||
        dest.includes(q) ||
        vsl.includes(q) ||
        carr.includes(q)
      );
    });
  }, [visibleConsolidations, boxSearch]);

  const readyBoxesCount = useMemo(() => {
    return visibleConsolidations.filter(c => !getLinkedShipment(c)).length;
  }, [visibleConsolidations, visibleShipments]);

  // Checkbox toggle handlers
  const handleToggleSelectBox = (id) => {
    setSelectedBoxIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllBoxes = () => {
    const readyBoxes = filteredBoxes.filter(c => !getLinkedShipment(c));
    const allReadySelected = readyBoxes.length > 0 && readyBoxes.every(c => selectedBoxIds.includes(c.id || c.consolidationNumber));
    if (allReadySelected) {
      setSelectedBoxIds([]);
    } else {
      setSelectedBoxIds(readyBoxes.map(c => c.id || c.consolidationNumber));
    }
  };

  // Handle direct "Ship This Box" click
  const handleShipSingleBox = (consol) => {
    setSelectedConsolForShipment(consol);
    setShowAddModal(true);
  };

  // Handle bulk or selected box shipping
  const handleShipSelectedBoxes = () => {
    if (selectedBoxIds.length === 0) return;
    const firstSelected = visibleConsolidations.find(c => selectedBoxIds.includes(c.id || c.consolidationNumber));
    if (firstSelected) {
      setSelectedConsolForShipment(firstSelected);
      setShowAddModal(true);
    }
  };

  // Handle Save from Shipment Modal -> Navigate directly to Master Bills
  const handleSaveShipment = async (newShipmentData) => {
    const created = await createShipment(newShipmentData);
    setShowAddModal(false);
    setSelectedConsolForShipment(null);
    setSelectedBoxIds([]);

    // Direct redirect to Master Bills & Manifests as requested by user
    if (onNavigate) {
      onNavigate('bills-of-lading');
    }
  };

  const shipmentColumns = [
    {
      header: 'Shipment #',
      accessor: 'shipmentNumber',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.shipmentNumber}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Booked: {item.bookingDate || item.etd}
          </div>
        </div>
      )
    },
    {
      header: 'Destination & Origin',
      accessor: 'destinationPort',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0A192F' }}>{item.destinationPort}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>From {item.origin}</div>
        </div>
      )
    },
    {
      header: 'Vessel / Container',
      accessor: 'vesselName',
      render: (item) => (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.vesselName || 'Ocean Vessel'}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.containerNumber} ({item.containerType || "40' Standard"})
          </div>
        </div>
      )
    },
    {
      header: 'ETD / ETA',
      accessor: 'etd',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.78rem' }}>{item.etd || 'TBD'}</div>
          <div style={{ fontSize: '0.72rem', color: '#0284C7' }}>
            → {item.eta || 'TBD'}
          </div>
        </div>
      )
    },
    {
      header: 'Tracking #',
      accessor: 'trackingNumber',
      render: (item) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700, color: '#2563EB' }}>
          {item.trackingNumber}
        </span>
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
      width: '120px',
      render: (item) => {
        const menuKey = item.id || item.shipmentNumber;
        const isOpen = activeMenuId === menuKey;

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-outline btn-xs"
              style={{ fontSize: '0.72rem', padding: '2px 8px', color: '#0369A1', borderColor: '#BAE6FD', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('bills-of-lading');
              }}
              title="Go to Master Bill of Lading"
            >
              <FileSpreadsheet size={12} />
              <span>Master B/L ➔</span>
            </button>

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
                  width: '28px',
                  height: '28px',
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
                <MoreVertical size={15} />
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
                    minWidth: '180px',
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
                      onNavigate('bills-of-lading');
                    }}
                  >
                    <FileSpreadsheet size={14} style={{ color: '#059669' }} />
                    <span style={{ fontWeight: 600, color: '#059669' }}>Go to Master B/L</span>
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
                      onNavigate('shipments', item.id || item.shipmentNumber);
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
                      onNavigate('tracking', item.trackingNumber);
                    }}
                  >
                    <Search size={14} style={{ color: '#0284C7' }} />
                    <span>Track Consignment</span>
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
                      setEditingShipment(item);
                    }}
                  >
                    <Edit2 size={14} style={{ color: '#D97706' }} />
                    <span>Edit Shipment</span>
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
                      setDeletingShipment(item);
                    }}
                  >
                    <Trash2 size={14} style={{ color: '#EF4444' }} />
                    <span>Delete Shipment</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        title="Ocean Freight Shipments"
        subtitle="Manage container boxes, prepare shipments, and issue Master Bills of Lading."
        icon={Ship}
        breadcrumbs={[
          { label: 'Operations', href: '#' },
          { label: 'Ocean Shipments' }
        ]}
        actions={
          !isAgent && (
            <button
              onClick={() => {
                setSelectedConsolForShipment(null);
                setShowAddModal(true);
              }}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
            >
              <Plus size={15} />
              <span>Create Shipment</span>
            </button>
          )
        }
      />

      <WorkflowIndicator currentStage="shipments" onNavigate={onNavigate} />

      {/* Primary Navigation Tabs */}
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
            onClick={() => setActiveViewTab('boxes')}
            className={`btn btn-sm ${activeViewTab === 'boxes' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontWeight: 700, fontSize: '0.82rem', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Box size={15} />
            <span>Select Container Boxes to Ship</span>
            <span
              style={{
                background: activeViewTab === 'boxes' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                color: activeViewTab === 'boxes' ? '#FFFFFF' : '#475569',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: 700
              }}
            >
              {visibleConsolidations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('shipments')}
            className={`btn btn-sm ${activeViewTab === 'shipments' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontWeight: 700, fontSize: '0.82rem', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Ship size={15} />
            <span>Active Ocean Shipments</span>
            <span
              style={{
                background: activeViewTab === 'shipments' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                color: activeViewTab === 'shipments' ? '#FFFFFF' : '#475569',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: 700
              }}
            >
              {visibleShipments.length}
            </span>
          </button>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
          {activeViewTab === 'boxes'
            ? 'Select packed container boxes ready for ocean voyage to auto-fill shipment and proceed to Master B/L.'
            : 'Track ocean freight voyages, milestones, and master documentation status.'}
        </div>
      </div>

      {/* VIEW 1: Container Boxes to Ship */}
      {activeViewTab === 'boxes' && (
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0A192F', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Box size={17} style={{ color: '#0284C7' }} />
                <span>Container Boxes Arrived for Ocean Shipment</span>
                {readyBoxesCount > 0 && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '12px' }}>
                    {readyBoxesCount} Ready to Ship
                  </span>
                )}
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Select container boxes packed in Container Consolidation. When you click "Ship This Box", the form auto-fills so shipment is ready, then leads to Master Bill.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.35rem 0.65rem' }}>
                <Search size={15} style={{ color: '#64748B' }} />
                <input
                  type="text"
                  placeholder="Search Box #, container, seal, port..."
                  value={boxSearch}
                  onChange={(e) => setBoxSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: '230px' }}
                />
                {boxSearch && (
                  <button type="button" onClick={() => setBoxSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 0 }}>
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Bulk Ship CTA if any box selected */}
              {!isAgent && selectedBoxIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleShipSelectedBoxes}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, backgroundColor: '#059669', borderColor: '#059669' }}
                >
                  <Ship size={14} />
                  <span>Ship Selected Box ({selectedBoxIds.length}) & Go to Master B/L ➔</span>
                </button>
              )}
            </div>
          </div>

          {/* Container Boxes Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {!isAgent && (
                    <th style={{ padding: '0.7rem 0.75rem', width: '36px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={
                          filteredBoxes.filter(c => !getLinkedShipment(c)).length > 0 &&
                          filteredBoxes.filter(c => !getLinkedShipment(c)).every(c => selectedBoxIds.includes(c.id || c.consolidationNumber))
                        }
                        onChange={handleToggleSelectAllBoxes}
                        style={{ cursor: 'pointer' }}
                        title="Select all ready boxes"
                      />
                    </th>
                  )}
                  <th style={{ padding: '0.7rem 0.85rem' }}>Box / Consolidation #</th>
                  <th style={{ padding: '0.7rem 0.85rem' }}>Container &amp; Seal</th>
                  <th style={{ padding: '0.7rem 0.85rem' }}>Destination Port</th>
                  <th style={{ padding: '0.7rem 0.85rem' }}>Cargo Load</th>
                  <th style={{ padding: '0.7rem 0.85rem' }}>Vessel / Carrier</th>
                  <th style={{ padding: '0.7rem 0.85rem' }}>Status</th>
                  <th style={{ padding: '0.7rem 0.85rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBoxes.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B', fontSize: '0.85rem' }}>
                      <Box size={28} style={{ color: '#94A3B8', margin: '0 auto 8px', display: 'block' }} />
                      No container boxes found for shipment.
                      <div style={{ fontSize: '0.78rem', marginTop: '4px', color: '#94A3B8' }}>
                        Pack cargo in Container Consolidation first, or create a direct shipment.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBoxes.map((consol) => {
                    const boxKey = consol.id || consol.consolidationNumber;
                    const linkedShipment = getLinkedShipment(consol);
                    const isShipped = !!linkedShipment;
                    const isSelected = selectedBoxIds.includes(boxKey);

                    return (
                      <tr
                        key={`box-row-${boxKey}`}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          background: isSelected ? '#F0F9FF' : '#FFFFFF',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {!isAgent && (
                          <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isShipped}
                              onChange={() => handleToggleSelectBox(boxKey)}
                              style={{ cursor: isShipped ? 'not-allowed' : 'pointer' }}
                              title={isShipped ? 'Already shipped' : 'Select box'}
                            />
                          </td>
                        )}

                        <td style={{ padding: '0.75rem 0.85rem' }}>
                          <div style={{ fontWeight: 700, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.825rem' }}>
                            {consol.consolidationNumber}
                          </div>
                          <div style={{ fontSize: '0.71rem', color: '#64748B' }}>
                            {consol.containerType || "40' Standard GP"}
                          </div>
                        </td>

                        <td style={{ padding: '0.75rem 0.85rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1E293B', fontFamily: 'JetBrains Mono, monospace' }}>
                            {consol.containerNumber || 'TBD'}
                          </div>
                          <div style={{ fontSize: '0.71rem', color: '#64748B' }}>
                            Seal: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{consol.sealNumber || 'N/A'}</span>
                          </div>
                        </td>

                        <td style={{ padding: '0.75rem 0.85rem' }}>
                          <div style={{ fontWeight: 600, color: '#0284C7', fontSize: '0.8rem' }}>
                            {consol.destinationPort || consol.destinationCode || 'Caribbean'}
                          </div>
                          <div style={{ fontSize: '0.71rem', color: '#64748B' }}>
                            From Miami (USMIA)
                          </div>
                        </td>

                        <td style={{ padding: '0.75rem 0.85rem' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0A192F' }}>
                            {consol.totalPackages || 0} pkgs
                          </div>
                          <div style={{ fontSize: '0.71rem', color: '#64748B' }}>
                            {Number(consol.totalWeightLbs || 0).toLocaleString()} lbs • {consol.totalCbm || 0} CBM
                          </div>
                        </td>

                        <td style={{ padding: '0.75rem 0.85rem' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#1E293B' }}>
                            {consol.vesselName || 'Ocean Vessel'}
                          </div>
                          <div style={{ fontSize: '0.71rem', color: '#64748B' }}>
                            {consol.carrier || 'TBD'}
                          </div>
                        </td>

                        <td style={{ padding: '0.75rem 0.85rem' }}>
                          {isShipped ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#DCFCE7', color: '#166534', padding: '2px 7px', borderRadius: '10px' }}>
                                ✓ Shipped
                              </span>
                              <span style={{ fontSize: '0.69rem', color: '#0284C7', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                                {linkedShipment.shipmentNumber}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Box size={11} />
                              Ready to Ship
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                          {isShipped ? (
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              style={{ fontSize: '0.72rem', padding: '3px 8px', color: '#059669', borderColor: '#A7F3D0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => onNavigate('bills-of-lading')}
                              title="Go to Master Bill of Lading"
                            >
                              <FileSpreadsheet size={13} />
                              <span>Master B/L ➔</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              style={{ fontSize: '0.72rem', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}
                              onClick={() => handleShipSingleBox(consol)}
                              title="Ship this box and prepare shipment"
                            >
                              <Ship size={13} />
                              <span>Ship This Box</span>
                            </button>
                          )}
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

      {/* VIEW 2: Active Ocean Shipments */}
      {activeViewTab === 'shipments' && (
        <ResponsiveTable
          columns={shipmentColumns}
          data={visibleShipments}
          searchPlaceholder="Search by shipment #, tracking #, destination, vessel..."
          filterOptions={['All']}
          pageSize={8}
          emptyTitle="No Shipments Found"
          emptyWhy="No ocean freight shipments match your search or filter."
          emptyNextStep="Select a container box above or create a new shipment."
          emptyActionLabel="Create Shipment"
          onEmptyAction={() => {
            setSelectedConsolForShipment(null);
            setShowAddModal(true);
          }}
          onRowClick={(item) => onNavigate('shipments', item.id || item.shipmentNumber)}
        />
      )}

      {/* Create / Ship Box Modal (Pre-populated with selected box data, navigates to Master B/L upon creation) */}
      <ShipmentModal
        isOpen={showAddModal}
        isEdit={false}
        initialConsolidation={selectedConsolForShipment}
        availableConsolidations={visibleConsolidations.filter(c => !getLinkedShipment(c))}
        onClose={() => {
          setShowAddModal(false);
          setSelectedConsolForShipment(null);
        }}
        onSave={handleSaveShipment}
      />

      {/* Edit Shipment Modal */}
      <ShipmentModal
        isOpen={!!editingShipment}
        shipment={editingShipment}
        isEdit={true}
        onClose={() => setEditingShipment(null)}
        onSave={async (updates) => {
          await updateShipment(editingShipment.id || editingShipment.shipmentNumber, updates);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingShipment}
        onClose={() => setDeletingShipment(null)}
        itemName={deletingShipment?.shipmentNumber}
        itemType="Shipment"
        onConfirm={async () => {
          const target = deletingShipment;
          if (target) {
            await deleteShipment(target.id || target.shipmentNumber);
          }
        }}
      />
    </div>
  );
};
