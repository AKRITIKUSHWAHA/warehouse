import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ManifestModal } from '../../components/modals/ManifestModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { FileSpreadsheet, Eye, Edit2, Trash2, FileCode, Download, Plus, Printer, RefreshCw, MoreVertical } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { manifestService } from '../../services/manifestService';
import { useToast } from '../../context/ToastContext';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import { useAuth } from '../../context/AuthContext';

export const ManifestsList = ({ onNavigate, hideHeaderWorkflow = false }) => {
  const { manifests, createManifest, updateManifest, deleteManifest, fetchMenuApi } = useAppData();
  const { isAgent, currentUser } = useAuth();
  const { showToast } = useToast();
  const [editingManifest, setEditingManifest] = useState(null);
  const [deletingManifest, setDeletingManifest] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    if ((!manifests || manifests.length === 0) && fetchMenuApi) {
      fetchMenuApi('manifests');
    }
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (fetchMenuApi) await fetchMenuApi('manifests');
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const visibleManifests = isAgent
    ? manifests.filter(m => {
        if (!currentUser?.agentId && !currentUser?.destinationPortCode) return true;
        const mPort = (m.portOfDischarge || '').toUpperCase();
        const mAgentId = m.agentId;
        const userPort = (currentUser?.destinationPortCode || '').toUpperCase();
        const userAgentId = currentUser?.agentId;

        if (userAgentId && mAgentId === userAgentId) return true;
        if (m.destinationCode && m.destinationCode === currentUser?.destinationPortCode) return true;
        if (userPort && mPort.includes(userPort)) return true;
        return false;
      })
    : manifests;

  const columns = [
    {
      header: 'Manifest #',
      accessor: 'manifestNumber',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.manifestNumber}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.createdAt}</div>
          {item.masterBLNumber && (
            <div style={{ fontSize: '0.7rem', color: '#0284C7', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
              Master B/L: {item.masterBLNumber}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Title & Routing',
      accessor: 'title',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0A192F' }}>{item.title}</div>
          <div style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 600 }}>
            {item.portOfLoading || 'Miami'} → {item.portOfDischarge || 'Pending Port'}
          </div>
        </div>
      )
    },
    {
      header: 'Vessel & Carrier',
      accessor: 'vesselName',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{item.vesselName}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.carrier}</div>
        </div>
      )
    },
    {
      header: 'Manifest Cargo',
      accessor: 'totalPackages',
      render: (item) => {
        const cft = item.totalCft || (item.totalCbm ? (parseFloat(item.totalCbm) * 35.3147).toFixed(1) : '0.0');
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{item.totalPackages} pkgs ({item.totalBLs} B/Ls)</div>
            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
              {item.totalWeightKg?.toLocaleString()} kg • <strong style={{ color: '#D97706', fontWeight: 700 }}>{cft} CFT</strong> <span style={{ color: '#64748B' }}>({item.totalCbm} CBM)</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => (
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: item.status.includes('Hold') ? '#B45309' : '#059669', background: item.status.includes('Hold') ? '#FEF3C7' : '#ECFDF5', padding: '0.25rem 0.6rem', borderRadius: '4px' }}>
          {item.status}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      width: '70px',
      render: (item) => {
        const menuKey = item.id || item.manifestNumber;
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
                  minWidth: '185px',
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
                    onNavigate('manifests', item.id);
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
                    onNavigate('manifests', item.id);
                    setTimeout(() => window.print(), 300);
                  }}
                >
                  <Printer size={14} style={{ color: '#059669' }} />
                  <span>Print Manifest</span>
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
                    manifestService.exportCsv(item);
                    showToast(`Exported CSV for ${item.manifestNumber}.`, 'success', 'CSV Exported');
                  }}
                >
                  <Download size={14} style={{ color: '#0284C7' }} />
                  <span>Export CSV / XML</span>
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
                    setEditingManifest(item);
                  }}
                >
                  <Edit2 size={14} style={{ color: '#D97706' }} />
                  <span>Edit Manifest</span>
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
                    setDeletingManifest(item);
                  }}
                >
                  <Trash2 size={14} style={{ color: '#EF4444' }} />
                  <span>Delete Manifest</span>
                </button>
              </div>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {!hideHeaderWorkflow && (
        <>
          <PageHeader
            title="Shipping Manifests"
            subtitle="Generate and export ocean cargo manifests for port and customs clearance."
            icon={FileSpreadsheet}
            breadcrumbs={[
              { label: 'Documentation', href: '#' },
              { label: 'Customs Manifests' }
            ]}
            actions={
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={handleManualRefresh}
                  className="btn btn-outline btn-sm"
                  title="Refresh Manifests from Database"
                  disabled={isRefreshing}
                >
                  <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                  <span className="hide-mobile">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
                </button>
                {!isAgent && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary btn-sm"
                  >
                    <Plus size={15} />
                    <span>Generate Manifest</span>
                  </button>
                )}
              </div>
            }
          />

          {/* Primary Workflow Journey Indicator */}
          <WorkflowIndicator currentStage="manifests" onNavigate={onNavigate} />
        </>
      )}

      <ResponsiveTable
        columns={columns}
        data={visibleManifests}
        searchPlaceholder="Search manifests, vessel, carrier, destination..."
        pageSize={8}
        onRowClick={(item) => onNavigate('manifests', item.id)}
        emptyTitle="No shipping manifests created yet"
        emptyWhy="Manifests compile loaded shipment bills of lading for port authority and customs declaration."
        emptyNextStep="Create a manifest for an outgoing shipment or export destination manifests."
        emptyActionLabel="Create Manifest"
        onEmptyAction={() => setShowAddModal(true)}
      />

      {/* Add Manifest Modal */}
      <ManifestModal
        isOpen={showAddModal}
        isEdit={false}
        onClose={() => setShowAddModal(false)}
        onSave={async (newManifestData) => {
          await createManifest(newManifestData);
        }}
      />

      {/* Edit Manifest Modal */}
      <ManifestModal
        isOpen={!!editingManifest}
        manifest={editingManifest}
        isEdit={true}
        onClose={() => setEditingManifest(null)}
        onSave={async (updates) => {
          await updateManifest(editingManifest.id, updates);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingManifest}
        onClose={() => setDeletingManifest(null)}
        itemName={deletingManifest?.manifestNumber}
        itemType="Manifest"
        onConfirm={async () => {
          await deleteManifest(deletingManifest.id);
        }}
      />
    </div>
  );
};

