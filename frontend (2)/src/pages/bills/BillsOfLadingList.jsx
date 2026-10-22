import React, { useState, useEffect } from 'react';
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
  MoreVertical
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ManifestsList } from '../manifests/ManifestsList';

export const BillsOfLadingList = ({ onNavigate, initialTab = 'mbl' }) => {
  const { billsOfLading, clearBLHold, placeBLHold, createBillOfLading, updateBillOfLading, deleteBillOfLading, generateManifestFromMasterBL, houseBills, manifests = [], fetchMenuApi } = useAppData();
  const { isAgent, currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState(initialTab || 'mbl');
  const [activeBLForClear, setActiveBLForClear] = useState(null);
  const [activeBLForPlace, setActiveBLForPlace] = useState(null);
  const [editingBL, setEditingBL] = useState(null);
  const [deletingBL, setDeletingBL] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    if ((!billsOfLading || billsOfLading.length === 0) && fetchMenuApi) {
      fetchMenuApi('bills-of-lading');
    }
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (fetchMenuApi) await fetchMenuApi('bills-of-lading');
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const visibleBLs = isAgent
    ? billsOfLading.filter(b => {
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
      })
    : billsOfLading;

  // Table Columns with Contextual Actions per Status
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
          <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{item.oceanVessel}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.carrier}</div>
        </div>
      )
    },
    {
      header: 'Port of Discharge',
      accessor: 'portOfDischarge',
      render: (item) => (
        <span style={{ fontWeight: 600, color: '#0284C7' }}>{item.portOfDischarge}</span>
      )
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
      width: '70px',
      render: (item) => {
        const menuKey = item.id || item.blNumber;
        const isOpen = activeMenuId === menuKey;
        const isOnHold = item.status === 'On Hold' || item.holdDetails?.isOnHold;
        const isCancelled = item.status === 'Cancelled';
        const isReleased = item.status === 'Released';
        const isDraft = item.status === 'Draft';

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
                          showToast(`Manifest ${newManifest.manifestNumber || newManifest.id} generated in 1 click!`, 'success', 'Manifest Ready');
                          onNavigate('manifests', newManifest.id || newManifest.manifestNumber);
                        }
                      } catch (err) {
                        showToast(err?.message || 'Failed to generate manifest', 'error', 'Error');
                      }
                    }}
                  >
                    <FileSpreadsheet size={14} style={{ color: '#0284C7' }} />
                    <span>⚡ 1-Click Manifest</span>
                  </button>
                )}

                {isReleased && (
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
                    <Edit2 size={14} style={{ color: '#64748B' }} />
                    <span>Edit Master B/L</span>
                  </button>
                )}

                {!isAgent && isDraft && (
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
                    <AlertTriangle size={14} style={{ color: '#D97706' }} />
                    <span>Place On Hold</span>
                  </button>
                )}

                {!isAgent && isOnHold && !isCancelled && (
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
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={handleManualRefresh}
              className="btn btn-outline btn-sm"
              title="Refresh B/Ls from Database"
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hide-mobile">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
            {!isAgent && (
              <>
                <button
                  onClick={() => onNavigate('house-bills', 'create')}
                  className="btn btn-outline btn-sm"
                  title="Issue customer House Bill of Lading"
                >
                  <Plus size={15} />
                  <span>Issue House B/L</span>
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary btn-sm"
                  title="Issue ocean carrier Master Bill of Lading"
                >
                  <Plus size={15} />
                  <span>Issue Master B/L</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Subtle Workflow Indicator */}
      <WorkflowIndicator currentStage="bills-of-lading" onNavigate={onNavigate} />

      {/* ⭐ UNIFIED SUB-TAB NAVIGATION: Master B/L (MBL) + Customs Manifests */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('mbl')}
            className={`btn btn-sm ${activeTab === 'mbl' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontWeight: 700, fontSize: '0.8rem', padding: '0.35rem 0.85rem', gap: '6px' }}
          >
            <Ship size={15} />
            <span>Master Bills of Lading (MBL)</span>
            <span
              style={{
                background: activeTab === 'mbl' ? 'rgba(255,255,255,0.2)' : '#EFF6FF',
                color: activeTab === 'mbl' ? '#FFFFFF' : '#2563EB',
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
            style={{ fontWeight: 700, fontSize: '0.8rem', padding: '0.35rem 0.85rem', gap: '6px' }}
          >
            <FileSpreadsheet size={15} style={{ color: activeTab === 'manifests' ? '#FFFFFF' : '#0284C7' }} />
            <span>Customs Cargo Manifests</span>
            <span
              style={{
                background: activeTab === 'manifests' ? 'rgba(255,255,255,0.2)' : '#F0F9FF',
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

          <button
            type="button"
            onClick={() => onNavigate('house-bills')}
            className="btn btn-sm btn-ghost"
            style={{ fontWeight: 600, fontSize: '0.8rem', padding: '0.35rem 0.85rem', color: '#475569', gap: '6px' }}
            title="Switch to customer House Bills of Lading"
          >
            <FileText size={15} style={{ color: '#2563EB' }} />
            <span>House Bills of Lading (HBL)</span>
            <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
              {houseBills.length}
            </span>
          </button>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
          {activeTab === 'mbl' ? (
            <span>Showing <strong>Carrier Master B/Ls</strong>. Generate a 1-click customs manifest from any B/L action menu.</span>
          ) : (
            <span>Showing <strong>Customs Cargo Manifests</strong>. Created from Master B/Ls for customs clearance.</span>
          )}
        </div>
      </div>

      {/* Conditional Content: ManifestsList or Master B/L Table */}
      {activeTab === 'manifests' ? (
        <ManifestsList onNavigate={onNavigate} hideHeaderWorkflow={true} />
      ) : (
        <ResponsiveTable
          columns={columns}
          data={visibleBLs}
          searchPlaceholder="Search B/L #, consignee, shipper, container, vessel..."
          filterOptions={['All', 'Draft', 'On Hold', 'Released', 'Cancelled']}
          pageSize={8}
          emptyTitle="No Master Bills of Lading Found"
          emptyWhy="No Master B/L records match your search or filter criteria."
          emptyNextStep="Issue a new Master B/L or build a consolidation to generate one automatically."
          emptyActionLabel="Issue Master B/L"
          onEmptyAction={() => setShowAddModal(true)}
          onRowClick={(item) => onNavigate('bills-of-lading', item.id || item.blNumber)}
        />
      )}

      {/* Add Master B/L Modal */}
      <BillOfLadingModal
        isOpen={showAddModal}
        isEdit={false}
        onClose={() => setShowAddModal(false)}
        onSave={async (newBLData) => {
          await createBillOfLading(newBLData);
        }}
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
