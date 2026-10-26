import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import { ConsolidationModal } from '../../components/modals/ConsolidationModal';
import { BillOfLadingModal } from '../../components/modals/BillOfLadingModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import {
  Layers,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Ship,
  Box,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  FileText,
  MoreVertical,
  Package,
  Search,
  CheckCircle2,
  Building2,
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';

export const ConsolidationsList = ({ onNavigate }) => {
  const {
    consolidations = [],
    warehouseReceipts = [],
    houseBills = [],
    ports = [],
    shipments = [],
    updateConsolidation,
    deleteConsolidation,
    createBillOfLading,
    fetchMenuApi
  } = useAppData();

  const { isAgent, currentUser } = useAuth();
  const [editingConsolidation, setEditingConsolidation] = useState(null);
  const [creatingBLForConsolidation, setCreatingBLForConsolidation] = useState(null);
  const [deletingConsolidation, setDeletingConsolidation] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Top navigation tabs: Customer Bills to Consolidate vs Built Consolidations
  const [activeViewTab, setActiveViewTab] = useState('bills');
  const [billSearch, setBillSearch] = useState('');
  const [selectedHbls, setSelectedHbls] = useState([]);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (fetchMenuApi) {
      fetchMenuApi('consolidations');
    }
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (fetchMenuApi) await fetchMenuApi('consolidations');
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      onNavigate('house-bills');
    }
  };

  // Filter if Agent
  const visibleConsolidations = isAgent
    ? consolidations.filter(c => {
        if (!currentUser?.agentId && !currentUser?.destinationPortCode) return true;
        if (currentUser?.agentId && c.agentId === currentUser.agentId) return true;
        if (currentUser?.destinationPortCode && (c.destinationCode === currentUser.destinationPortCode || c.destinationPort?.includes(currentUser.destinationPortCode))) return true;
        return false;
      })
    : consolidations;

  const visibleHouseBills = useMemo(() => {
    if (isAgent) {
      return houseBills.filter(h =>
        h.agentId === currentUser?.agentId ||
        (currentUser?.destinationPortCode && (h.destinationCode === currentUser.destinationPortCode || h.destinationPort?.includes(currentUser.destinationPortCode)))
      );
    }
    return houseBills;
  }, [houseBills, isAgent, currentUser]);

  // Check if an HBL is already consolidated
  const getHblConsolidation = (hbl) => {
    if (hbl.assignedConsolidationId) {
      return consolidations.find(c => c.id === hbl.assignedConsolidationId || c.consolidationNumber === hbl.assignedConsolidationId) || { consolidationNumber: hbl.assignedConsolidationId };
    }
    return consolidations.find(c =>
      (Array.isArray(c.houseBillIds) && (c.houseBillIds.includes(hbl.id) || c.houseBillIds.includes(hbl.hblNumber))) ||
      (Array.isArray(c.house_bill_ids) && (c.house_bill_ids.includes(hbl.id) || c.house_bill_ids.includes(hbl.hblNumber)))
    );
  };

  // Filtered House Bills for Tab 1
  const filteredHouseBills = useMemo(() => {
    return visibleHouseBills.filter(h => {
      if (billSearch.trim()) {
        const q = billSearch.toLowerCase();
        const cust = (typeof h.customerName === 'string' ? h.customerName : '') || (typeof h.consignee === 'object' ? h.consignee?.name : h.consignee) || '';
        const shipper = typeof h.shipper === 'object' ? h.shipper?.name : (h.shipper || '');
        const port = h.destinationPort || h.destinationCode || '';
        const num = h.hblNumber || '';
        const match =
          cust.toLowerCase().includes(q) ||
          shipper.toLowerCase().includes(q) ||
          port.toLowerCase().includes(q) ||
          num.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [visibleHouseBills, billSearch]);

  const readyBillsCount = useMemo(() => {
    return visibleHouseBills.filter(h => !getHblConsolidation(h) && h.status !== 'Consolidated').length;
  }, [visibleHouseBills, consolidations]);

  const handleToggleSelectAll = () => {
    const selectable = filteredHouseBills
      .filter(h => !getHblConsolidation(h) && h.status !== 'Consolidated')
      .map(h => h.id || h.hblNumber);
    if (selectable.length === 0) return;

    const allSelected = selectable.every(id => selectedHbls.includes(id));
    if (allSelected) {
      setSelectedHbls(prev => prev.filter(id => !selectable.includes(id)));
    } else {
      setSelectedHbls(prev => Array.from(new Set([...prev, ...selectable])));
    }
  };

  const handleToggleSelectHbl = (id) => {
    setSelectedHbls(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConsolidateSingle = (hbl) => {
    const id = hbl.id || hbl.hblNumber;
    try {
      localStorage.setItem('vicustoms_selected_consol_hbls', JSON.stringify([id]));
    } catch (e) {}
    onNavigate('consolidations', 'create');
  };

  const handleConsolidateBulk = () => {
    if (selectedHbls.length === 0) return;
    try {
      localStorage.setItem('vicustoms_selected_consol_hbls', JSON.stringify(selectedHbls));
    } catch (e) {}
    onNavigate('consolidations', 'create');
  };



  const columns = [
    {
      header: 'Consolidation #',
      accessor: 'consolidationNumber',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.consolidationNumber}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.createdDate}</div>
        </div>
      )
    },
    {
      header: 'Destination Port',
      accessor: 'destinationPort',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0A192F' }}>{item.destinationPort}</div>
          <div style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 600 }}>
            {item.loadingPort || 'Port of Miami (USMIA)'} ➔ {item.destinationCode || 'STT'}
          </div>
        </div>
      )
    },
    {
      header: 'Container & Seal',
      accessor: 'containerNumber',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
            {item.containerNumber}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Seal: {item.sealNumber} ({item.containerType})
          </div>
        </div>
      )
    },
    {
      header: 'Vessel & Carrier',
      accessor: 'vesselName',
      render: (item) => (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.vesselName}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.carrier}</div>
        </div>
      )
    },
    {
      header: 'Consolidated Cargo',
      accessor: 'totalPackages',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600 }}>{item.totalPackages} pkgs ({item.totalReceipts} WRs)</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            {item.totalWeightLbs?.toLocaleString()} lbs • <strong style={{ color: '#D97706' }}>{item.totalCft || (item.totalCbm ? Number((item.totalCbm * 35.3147).toFixed(1)) : 0)} CFT</strong> ({item.totalCbm} CBM)
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => {
        const linkedShipment = (shipments || []).find(s =>
          s.id === item.assignedShipmentId ||
          s.shipmentNumber === item.assignedShipmentId ||
          s.consolidationId === item.id ||
          s.consolidationId === item.consolidationNumber
        );

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
            <StatusBadge status={item.status} size="sm" />
            {linkedShipment ? (
              <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700 }}>
                Shipment: {linkedShipment.shipmentNumber}
              </span>
            ) : (
              <span style={{ fontSize: '0.68rem', color: '#D97706', fontWeight: 600 }}>
                Unassigned Shipment
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Actions',
      align: 'right',
      width: '70px',
      render: (item) => {
        const menuKey = item.id || item.consolidationNumber;
        const isOpen = activeMenuId === menuKey;

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
                background: isOpen ? '#F1F5F9' : 'transparent'
              }}
              title="Consolidation Actions"
            >
              <MoreVertical size={16} />
            </button>

            {isOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '4px',
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #E2E8F0',
                  padding: '4px',
                  minWidth: '220px',
                  zIndex: 50,
                  textAlign: 'left'
                }}
              >
                {!isAgent && (
                  <button
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.45rem 0.65rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#0284C7',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => {
                      setActiveMenuId(null);
                      setCreatingBLForConsolidation(item);
                    }}
                  >
                    <FileText size={14} style={{ color: '#0284C7' }} />
                    <span>Create Master B/L</span>
                  </button>
                )}

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
                    if (item.assignedShipmentId) {
                      onNavigate('shipments', item.assignedShipmentId);
                    } else {
                      onNavigate('bills-of-lading');
                    }
                  }}
                >
                  <ArrowRight size={14} style={{ color: '#059669' }} />
                  <span>Go to Shipment / Master B/L</span>
                </button>

                {!isAgent && (
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
                      setEditingConsolidation(item);
                    }}
                  >
                    <Edit2 size={14} style={{ color: '#64748B' }} />
                    <span>Edit Consolidation</span>
                  </button>
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
                        setDeletingConsolidation(item);
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
        title="Consolidations"
        subtitle="Group staged warehouse cargo into destination ocean containers."
        icon={Layers}
        breadcrumbs={[
          { label: 'Operations', href: '#' },
          { label: 'Consolidations' }
        ]}
        actions={
          !isAgent && (
            <button
              onClick={() => onNavigate('consolidations', 'create')}
              className="btn btn-primary btn-sm"
            >
              <Plus size={15} />
              <span>Build Consolidation</span>
            </button>
          )
        }
      />

      <WorkflowIndicator currentStage="consolidations" onNavigate={onNavigate} />

      {/* Primary Navigation Tabs: Select Customer Bills vs Built Consolidations (Containers) */}
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
            onClick={() => setActiveViewTab('bills')}
            className={`btn btn-sm ${activeViewTab === 'bills' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontWeight: 700, fontSize: '0.82rem', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={15} />
            <span>Select Customer Bills to Consolidate</span>
            <span
              style={{
                background: activeViewTab === 'bills' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                color: activeViewTab === 'bills' ? '#FFFFFF' : '#475569',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: 700
              }}
            >
              {visibleHouseBills.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('consolidations')}
            className={`btn btn-sm ${activeViewTab === 'consolidations' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontWeight: 700, fontSize: '0.82rem', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Layers size={15} />
            <span>Built Consolidations (Containers)</span>
            <span
              style={{
                background: activeViewTab === 'consolidations' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                color: activeViewTab === 'consolidations' ? '#FFFFFF' : '#475569',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: 700
              }}
            >
              {visibleConsolidations.length}
            </span>
          </button>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
          {activeViewTab === 'bills'
            ? 'Select customer House Bills below to pack multiple customer orders into a container.'
            : 'List of built ocean container consolidations grouped and ready for shipment.'}
        </div>
      </div>

      {/* VIEW 1: Customer Bills to Consolidate */}
      {activeViewTab === 'bills' && (
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0A192F', margin: 0 }}>
                Customer Bills Ready for Container Consolidation
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Select customer House Bills below to pack multiple customer orders into 1 ocean container box.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.35rem 0.65rem' }}>
                <Search size={15} style={{ color: '#64748B' }} />
                <input
                  type="text"
                  placeholder="Search customer, HBL, port..."
                  value={billSearch}
                  onChange={(e) => setBillSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: '230px' }}
                />
                {billSearch && (
                  <button type="button" onClick={() => setBillSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 0 }}>
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Bulk Consolidate CTA if any selected */}
              {!isAgent && selectedHbls.length > 0 && (
                <button
                  type="button"
                  onClick={handleConsolidateBulk}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                >
                  <Layers size={14} />
                  <span>Build Container ({selectedHbls.length} Selected)</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {!isAgent && (
                    <th style={{ padding: '0.75rem 0.75rem', width: '36px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={
                          filteredHouseBills.filter(h => !getHblConsolidation(h) && h.status !== 'Consolidated').length > 0 &&
                          filteredHouseBills.filter(h => !getHblConsolidation(h) && h.status !== 'Consolidated').every(h => selectedHbls.includes(h.id || h.hblNumber))
                        }
                        onChange={handleToggleSelectAll}
                        style={{ cursor: 'pointer' }}
                        title="Select all ready bills"
                      />
                    </th>
                  )}
                  <th style={{ padding: '0.75rem 1rem' }}>House B/L #</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Customer / Consignee</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Destination Port</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Linked Cargo &amp; WRs</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Volume</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Consolidation Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHouseBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B', fontSize: '0.85rem' }}>
                      <Package size={28} style={{ color: '#94A3B8', margin: '0 auto 8px', display: 'block' }} />
                      No customer House Bills match your search or filter.
                    </td>
                  </tr>
                ) : (
                  filteredHouseBills.map((hbl) => {
                    const id = hbl.id || hbl.hblNumber;
                    const linkedConsol = getHblConsolidation(hbl);
                    const isConsolidated = !!linkedConsol || hbl.status === 'Consolidated';
                    const isSelected = selectedHbls.includes(id);
                    const wrs = hbl.warehouseReceiptIds || [];

                    return (
                      <tr
                        key={id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          background: isSelected ? '#F0F9FF' : 'transparent',
                          transition: 'background 120ms ease'
                        }}
                      >
                        {!isAgent && (
                          <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>
                            {!isConsolidated ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectHbl(id)}
                                style={{ cursor: 'pointer' }}
                              />
                            ) : (
                              <CheckCircle2 size={16} style={{ color: '#10B981', margin: '0 auto' }} title="Already Consolidated" />
                            )}
                          </td>
                        )}
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 800, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>
                            {hbl.hblNumber}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            Issued: {hbl.issueDate || hbl.createdDate || 'Recent'}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: '#0A192F', fontSize: '0.85rem' }}>
                            {hbl.customerName || (typeof hbl.consignee === 'object' ? hbl.consignee?.name : hbl.consignee) || 'Customer'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            Shipper: {typeof hbl.shipper === 'object' ? hbl.shipper?.name : (hbl.shipper || 'N/A')}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontWeight: 700, color: '#0284C7', fontSize: '0.82rem' }}>
                            {hbl.destinationPort || hbl.destinationCode || 'Destination Port'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: '#D97706', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                            {wrs.length} WR(s) • {hbl.totalPieces || hbl.totalPackages || 1} pkgs
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            {hbl.totalWeightLbs ? `${Number(hbl.totalWeightLbs).toLocaleString()} lbs` : ''}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#D97706' }}>
                            {hbl.totalCft || 0} CFT
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#0284C7', fontWeight: 600 }}>
                            ({hbl.totalCbm || 0} CBM)
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {isConsolidated ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#ECFDF5',
                                color: '#059669',
                                border: '1px solid #A7F3D0',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}
                            >
                              <CheckCircle2 size={12} />
                              <span>Consolidated {linkedConsol?.consolidationNumber ? `(${linkedConsol.consolidationNumber})` : ''}</span>
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#FFFBEB',
                                color: '#D97706',
                                border: '1px solid #FDE68A',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}
                            >
                              <span>Ready to Consolidate</span>
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          {!isAgent && (
                            !isConsolidated ? (
                              <button
                                type="button"
                                onClick={() => handleConsolidateSingle(hbl)}
                                className="btn btn-primary btn-sm"
                                style={{
                                  padding: '0.3rem 0.7rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}
                              >
                                <Plus size={13} />
                                <span>Build Consolidation</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveViewTab('consolidations')}
                                className="btn btn-outline btn-sm"
                                style={{
                                  padding: '0.3rem 0.65rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span>View Container</span>
                                <ArrowRight size={12} />
                              </button>
                            )
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

      {/* VIEW 2: Built Consolidations (Containers) */}
      {activeViewTab === 'consolidations' && (
        <ResponsiveTable
          columns={columns}
          data={visibleConsolidations}
          searchPlaceholder="Search consolidations, container #, vessel, destination..."
          filterOptions={['All', 'Loaded', 'Sealed', 'Draft']}
          pageSize={8}
          emptyTitle="No Consolidations Found"
          emptyWhy="No ocean container consolidations have been created yet."
          emptyNextStep="Select customer bills above to build and group cargo into ocean containers."
          emptyActionLabel="Build Consolidation"
          onEmptyAction={() => onNavigate('consolidations', 'create')}
          onRowClick={(item) => {
            if (item.assignedShipmentId) {
              onNavigate('shipments', item.assignedShipmentId);
            }
          }}
        />
      )}

      {/* Edit Modal */}
      <ConsolidationModal
        isOpen={!!editingConsolidation}
        consolidation={editingConsolidation}
        onClose={() => setEditingConsolidation(null)}
        onSave={async (updates) => {
          await updateConsolidation(editingConsolidation.id, updates);
        }}
      />

      {/* Create Master B/L from Consolidation Modal */}
      {creatingBLForConsolidation && (
        <BillOfLadingModal
          isOpen={!!creatingBLForConsolidation}
          initialConsolidationNumber={creatingBLForConsolidation.consolidationNumber}
          onClose={() => setCreatingBLForConsolidation(null)}
          onSave={async (blData) => {
            const created = await createBillOfLading(blData);
            setCreatingBLForConsolidation(null);
            if (created) {
              onNavigate('bills-of-lading', created.id || created.blNumber);
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingConsolidation}
        onClose={() => setDeletingConsolidation(null)}
        itemName={deletingConsolidation?.consolidationNumber}
        itemType="Consolidation"
        onConfirm={async () => {
          await deleteConsolidation(deletingConsolidation.id);
        }}
      />
    </div>
  );
};
