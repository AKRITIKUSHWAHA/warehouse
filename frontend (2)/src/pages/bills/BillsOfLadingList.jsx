import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ClearHoldModal } from '../../components/modals/ClearHoldModal';
import { PlaceHoldModal } from '../../components/modals/PlaceHoldModal';
import { BillOfLadingModal } from '../../components/modals/BillOfLadingModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import {
  FileText,
  Eye,
  Edit2,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Download,
  AlertTriangle,
  Plus,
  Ship,
  HelpCircle,
  FileCheck,
  RefreshCw,
  Lock,
  FileSpreadsheet,
  MoreVertical,
  Box,
  Search,
  X
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ManifestsList } from '../manifests/ManifestsList';

export const BillsOfLadingList = ({ onNavigate, initialTab = null }) => {
  const {
    billsOfLading = [],
    shipments = [],
    consolidations = [],
    clearBLHold,
    placeBLHold,
    createBillOfLading,
    updateBillOfLading,
    deleteBillOfLading,
    generateManifestFromMasterBL,
    houseBills = [],
    manifests = [],
    fetchMenuApi
  } = useAppData();
  const { isAgent, currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeBLForClear, setActiveBLForClear] = useState(null);
  const [activeBLForPlace, setActiveBLForPlace] = useState(null);
  const [editingBL, setEditingBL] = useState(null);
  const [deletingBL, setDeletingBL] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Tab 1 Selection states
  const [shipmentSearch, setShipmentSearch] = useState('');
  const [selectedShipmentIds, setSelectedShipmentIds] = useState([]);
  const [selectedShipmentForBL, setSelectedShipmentForBL] = useState(null);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (fetchMenuApi) {
      fetchMenuApi('bills-of-lading');
    }
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (fetchMenuApi) await fetchMenuApi('bills-of-lading');
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const visibleBLs = useMemo(() => {
    if (isAgent) {
      return billsOfLading.filter(b => {
        if (!currentUser?.agentId && !currentUser?.destinationPortCode) return true;
        const bPort = (b.portOfDischarge || '').toUpperCase();
        const bAgentId = b.agentId;
        const userPort = (currentUser?.destinationPortCode || '').toUpperCase();
        const userAgentId = currentUser?.agentId;
        const userName = (currentUser?.name || '').toLowerCase();
        const bAgentName = (b.agentName || '').toLowerCase();

        if (userAgentId && bAgentId === userAgentId) return true;
        if (b.destinationPortCode && b.destinationPortCode === currentUser?.destinationPortCode) return true;
        if (userPort && bPort.includes(userPort)) return true;
        if (userName && bAgentName.includes(userName)) return true;
        return false;
      });
    }
    return billsOfLading;
  }, [billsOfLading, isAgent, currentUser]);

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

  // Find linked Master B/L for a shipment or consolidation box
  const getLinkedBL = (item) => {
    return visibleBLs.find(b =>
      (item.billOfLadingNumber && (b.blNumber === item.billOfLadingNumber || b.id === item.billOfLadingNumber)) ||
      (item.containerNumber && b.containerNumber === item.containerNumber) ||
      (item.consolidationId && (b.consolidationNumber === item.consolidationId || b.consolidationId === item.consolidationId)) ||
      (item.consolidationNumber && (b.consolidationNumber === item.consolidationNumber || b.consolidationId === item.consolidationNumber)) ||
      (item.shipmentNumber && (b.shipmentNumber === item.shipmentNumber || b.assignedShipmentId === item.shipmentNumber))
    );
  };

  // Combine shipments and any standalone consolidations ready for Master B/L
  const candidateShipmentsAndBoxes = useMemo(() => {
    const items = [...visibleShipments];

    visibleConsolidations.forEach(c => {
      const alreadyInShipments = items.some(s =>
        s.consolidationId === c.id ||
        s.consolidationId === c.consolidationNumber ||
        (c.containerNumber && s.containerNumber === c.containerNumber)
      );
      if (!alreadyInShipments) {
        items.push({
          ...c,
          isDirectBox: true,
          shipmentNumber: c.consolidationNumber,
          origin: c.origin || 'Port of Miami (USMIA)',
          destinationPort: c.destinationPort || c.destinationCode || '',
          vesselName: c.vesselName || 'Ocean Vessel',
          carrier: c.carrier || 'Tropical Shipping',
          containerNumber: c.containerNumber || '',
          sealNumber: c.sealNumber || '',
          totalPackages: c.totalPackages || 0,
          totalWeightLbs: c.totalWeightLbs || 0,
          totalCbm: c.totalCbm || 0
        });
      }
    });

    return items;
  }, [visibleShipments, visibleConsolidations]);

  const readyShipmentsCount = useMemo(() => {
    return candidateShipmentsAndBoxes.filter(s => !getLinkedBL(s)).length;
  }, [candidateShipmentsAndBoxes, visibleBLs]);

  // Default active tab: Master Bills of Lading (MBL)
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab) return initialTab;
    return 'mbl';
  });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Filtered candidate shipments based on search
  const filteredCandidateShipments = useMemo(() => {
    return candidateShipmentsAndBoxes.filter(item => {
      if (!shipmentSearch.trim()) return true;
      const q = shipmentSearch.toLowerCase();
      const num = (item.shipmentNumber || item.consolidationNumber || '').toLowerCase();
      const cont = (item.containerNumber || '').toLowerCase();
      const seal = (item.sealNumber || '').toLowerCase();
      const dest = (item.destinationPort || item.destinationCode || '').toLowerCase();
      const vsl = (item.vesselName || '').toLowerCase();
      const carr = (item.carrier || '').toLowerCase();
      return num.includes(q) || cont.includes(q) || seal.includes(q) || dest.includes(q) || vsl.includes(q) || carr.includes(q);
    });
  }, [candidateShipmentsAndBoxes, shipmentSearch]);

  // Selection handlers
  const handleToggleSelectShipment = (id) => {
    setSelectedShipmentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllShipments = () => {
    const unissued = filteredCandidateShipments.filter(s => !getLinkedBL(s));
    const allSelected = unissued.length > 0 && unissued.every(s => selectedShipmentIds.includes(s.id || s.shipmentNumber));
    if (allSelected) {
      setSelectedShipmentIds([]);
    } else {
      setSelectedShipmentIds(unissued.map(s => s.id || s.shipmentNumber));
    }
  };

  const handleIssueBLForShipment = (item) => {
    setSelectedShipmentForBL(item);
    setShowAddModal(true);
  };

  const handleIssueBLForSelected = () => {
    if (selectedShipmentIds.length === 0) return;
    const firstSelected = candidateShipmentsAndBoxes.find(s => selectedShipmentIds.includes(s.id || s.shipmentNumber));
    if (firstSelected) {
      setSelectedShipmentForBL(firstSelected);
      setShowAddModal(true);
    }
  };

  const handleSaveBL = async (newBLData) => {
    const created = await createBillOfLading(newBLData);
    setShowAddModal(false);
    setSelectedShipmentForBL(null);
    setSelectedShipmentIds([]);
    setActiveTab('mbl');
  };

  // Table Columns with Contextual Actions per Status for Tab 2 (MBL Table)
  const columns = [
    {
      header: 'B/L Number',
      accessor: 'blNumber',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.blNumber}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Issue: {item.issueDate || item.createdDate}
          </div>
        </div>
      )
    },
    {
      header: 'Consignee & Shipper',
      accessor: 'consignee',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0A192F' }}>{item.consignee?.name || item.consignee}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>From: {item.shipper?.name || item.shipper}</div>
        </div>
      )
    },
    {
      header: 'Vessel & Carrier',
      accessor: 'oceanVessel',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: item.oceanVessel ? '#0A192F' : '#94A3B8', fontStyle: item.oceanVessel ? 'normal' : 'italic' }}>
            {item.oceanVessel || 'Awaiting Vessel'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.carrier}</div>
        </div>
      )
    },
    {
      header: 'Port of Discharge',
      accessor: 'portOfDischarge',
      render: (item) => {
        const pod = item.portOfDischarge?.trim();
        return pod ? (
          <span style={{ fontWeight: 600, color: '#0284C7' }}>{pod}</span>
        ) : (
          <span
            style={{
              color: '#64748B',
              fontSize: '0.72rem',
              fontWeight: 600,
              background: '#F1F5F9',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px dashed #CBD5E1',
              display: 'inline-flex',
              alignItems: 'center',
              letterSpacing: '0.02em'
            }}
          >
            Pending / Not Set
          </span>
        );
      }
    },
    {
      header: 'Container & Volume',
      accessor: 'containerNumber',
      render: (item) => (
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 600 }}>
            {item.containerNumber}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
            {item.packageCount} pkgs • <strong style={{ color: '#D97706' }}>{item.cft || (item.cbm ? Number((item.cbm * 35.3147).toFixed(1)) : 0)} CFT</strong> ({item.cbm} CBM)
          </div>
        </div>
      )
    },
    {
      header: 'B/L Status',
      accessor: 'status',
      render: (item) => (
        <div>
          <StatusBadge status={item.status} />
          {item.status === 'On Hold' && (
            <div style={{ fontSize: '0.68rem', color: '#B45309', marginTop: '2px', fontWeight: 600 }}>
              Payment / Review Pending
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      width: '185px',
      render: (item) => {
        const menuKey = item.id || item.blNumber;
        const isOpen = activeMenuId === menuKey;
        const isOnHold = item.status === 'On Hold' || item.holdDetails?.isOnHold;
        const isCancelled = item.status === 'Cancelled';

        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
            {!isAgent && !isCancelled && (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (isOnHold) {
                    const confirmHold = window.confirm(`Notice: Master B/L ${item.blNumber} is currently ON HOLD. Proceed with generating manifest?`);
                    if (!confirmHold) return;
                  }
                  try {
                    showToast(`Generating manifest from Master B/L ${item.blNumber}...`, 'info', '1-Click Manifest');
                    const newManifest = await generateManifestFromMasterBL(item.id || item.blNumber);
                    if (newManifest) {
                      setActiveTab('manifests');
                    }
                  } catch (err) {
                    showToast(err?.message || 'Failed to generate manifest', 'error', 'Error');
                  }
                }}
                className="btn btn-outline btn-xs"
                style={{
                  color: '#0284C7',
                  borderColor: '#BAE6FD',
                  background: '#F0F9FF',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
                title="Generate Customs Cargo Manifest in 1 click"
              >
                <FileSpreadsheet size={13} style={{ color: '#0284C7' }} />
                <span>1-Click Manifest</span>
              </button>
            )}

            <div
              style={{ position: 'relative', display: 'inline-block', textAlign: 'right' }}
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
                  minWidth: '195px',
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
                    onNavigate('bills-of-lading', item.id || item.blNumber);
                  }}
                >
                  <Eye size={14} style={{ color: '#0284C7' }} />
                  <span>View Master B/L</span>
                </button>

                {!isAgent && !isCancelled && (
                  <button
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.45rem 0.65rem',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: '#0284C7',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F0F9FF'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={async () => {
                      setActiveMenuId(null);
                      if (isOnHold) {
                        const confirmHold = window.confirm(`Notice: Master B/L ${item.blNumber} is currently ON HOLD. Proceed with generating manifest?`);
                        if (!confirmHold) return;
                      }
                      try {
                        showToast(`Generating manifest from Master B/L ${item.blNumber}...`, 'info', '1-Click Manifest');
                        const newManifest = await generateManifestFromMasterBL(item.id || item.blNumber);
                        if (newManifest) {
                          setActiveTab('manifests');
                        }
                      } catch (err) {
                        showToast(err?.message || 'Failed to generate manifest', 'error', 'Error');
                      }
                    }}
                  >
                    <FileSpreadsheet size={14} style={{ color: '#0284C7' }} />
                    <span style={{ fontWeight: 600 }}>1-Click Outward Manifest</span>
                  </button>
                )}

                <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />

                {!isAgent && !isCancelled && (
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
                      setEditingBL(item);
                    }}
                  >
                    <Edit2 size={14} style={{ color: '#D97706' }} />
                    <span>Edit B/L</span>
                  </button>
                )}

                {!isAgent && !isCancelled && !isOnHold && (
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
                      setActiveBLForPlace(item);
                    }}
                  >
                    <ShieldAlert size={14} style={{ color: '#D97706' }} />
                    <span>Place on Hold</span>
                  </button>
                )}

                {!isAgent && !isCancelled && isOnHold && (
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
                      setActiveBLForClear(item);
                    }}
                  >
                    <CheckCircle2 size={14} style={{ color: '#059669' }} />
                    <span>Clear Hold &amp; Release</span>
                  </button>
                )}
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
      {/* Page Header */}
      <PageHeader
        title="Master Bills & Manifests"
        subtitle="Manage carrier Master B/Ls and generate customs manifests in 1 click."
        icon={FileText}
        breadcrumbs={[
          { label: 'Maritime', href: '#' },
          { label: 'Master Bills & Manifests' }
        ]}
        actions={
          !isAgent && (
            <button
              onClick={() => {
                setSelectedShipmentForBL(null);
                setShowAddModal(true);
              }}
              className="btn btn-primary btn-sm"
              title="Issue ocean carrier Master Bill of Lading"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
            >
              <Plus size={15} />
              <span>Issue Master B/L</span>
            </button>
          )
        }
      />

      {/* Workflow Indicator */}
      <WorkflowIndicator currentStage="bills-of-lading" onNavigate={onNavigate} />

      {/* ⭐ UNIFIED SUB-TAB NAVIGATION */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>

          <button
            type="button"
            onClick={() => setActiveTab('mbl')}
            className={`btn btn-sm ${activeTab === 'mbl' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontWeight: 700, fontSize: '0.8rem', padding: '0.35rem 0.85rem', gap: '6px', display: 'flex', alignItems: 'center' }}
          >
            <FileText size={15} />
            <span>Issued Master Bills of Lading (MBL)</span>
            <span
              style={{
                background: activeTab === 'mbl' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                color: activeTab === 'mbl' ? '#FFFFFF' : '#475569',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: 700
              }}
            >
              {visibleBLs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manifests')}
            className={`btn btn-sm ${activeTab === 'manifests' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontWeight: 700, fontSize: '0.8rem', padding: '0.35rem 0.85rem', gap: '6px', display: 'flex', alignItems: 'center' }}
          >
            <FileSpreadsheet size={15} style={{ color: activeTab === 'manifests' ? '#FFFFFF' : '#0284C7' }} />
            <span>Customs Cargo Manifests</span>
            <span
              style={{
                background: activeTab === 'manifests' ? 'rgba(255,255,255,0.25)' : '#F0F9FF',
                color: activeTab === 'manifests' ? '#FFFFFF' : '#0284C7',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: 700
              }}
            >
              {manifests.length}
            </span>
          </button>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
          {activeTab === 'mbl' ? (
            <span>Showing <strong>Carrier Master B/Ls</strong>. Link House Bills by Consolidation # and generate 1-click customs manifests.</span>
          ) : (
            <span>Showing <strong>Customs Cargo Manifests</strong> created from Master B/Ls for customs clearance.</span>
          )}
        </div>
      </div>

      {/* VIEW 2: Issued Master B/L Table */}
      {activeTab === 'mbl' && (
        <ResponsiveTable
          columns={columns}
          data={visibleBLs}
          searchPlaceholder="Search B/L #, consignee, shipper, container, vessel..."
          pageSize={8}
          emptyTitle="No Master Bills of Lading Found"
          emptyWhy="No Master B/L records match your search or filter criteria."
          emptyNextStep="Issue a new Master B/L or select a ready shipment from Tab 1."
          emptyActionLabel="Issue Master B/L"
          onEmptyAction={() => {
            setSelectedShipmentForBL(null);
            setShowAddModal(true);
          }}
          onRowClick={(item) => onNavigate('bills-of-lading', item.id || item.blNumber)}
        />
      )}

      {/* VIEW 3: Customs Cargo Manifests */}
      {activeTab === 'manifests' && (
        <ManifestsList onNavigate={onNavigate} hideHeaderWorkflow={true} />
      )}

      {/* Add Master B/L Modal (Pre-populated from selected shipment/box) */}
      <BillOfLadingModal
        isOpen={showAddModal}
        isEdit={false}
        initialShipment={selectedShipmentForBL}
        onClose={() => {
          setShowAddModal(false);
          setSelectedShipmentForBL(null);
        }}
        onSave={handleSaveBL}
      />

      {/* Edit Master B/L Modal */}
      <BillOfLadingModal
        isOpen={!!editingBL}
        bl={editingBL}
        isEdit={true}
        onClose={() => setEditingBL(null)}
        onSave={async (updates) => {
          await updateBillOfLading(editingBL.id || editingBL.blNumber, updates);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingBL}
        onClose={() => setDeletingBL(null)}
        itemName={deletingBL?.blNumber}
        itemType="Bill of Lading"
        onConfirm={async () => {
          await deleteBillOfLading(deletingBL.id || deletingBL.blNumber);
        }}
      />

      {/* Clear Hold Modal */}
      <ClearHoldModal
        isOpen={!!activeBLForClear}
        onClose={() => setActiveBLForClear(null)}
        bl={activeBLForClear}
        onConfirm={async (id, notes) => {
          await clearBLHold(id || activeBLForClear.id || activeBLForClear.blNumber, notes);
        }}
      />

      {/* Place Hold Modal */}
      <PlaceHoldModal
        isOpen={!!activeBLForPlace}
        onClose={() => setActiveBLForPlace(null)}
        bl={activeBLForPlace}
        onConfirm={async (id, reason, notes) => {
          await placeBLHold(id || activeBLForPlace.id || activeBLForPlace.blNumber, reason, notes);
        }}
      />
    </div>
  );
};
