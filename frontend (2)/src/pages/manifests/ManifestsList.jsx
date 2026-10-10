import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ManifestModal } from '../../components/modals/ManifestModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { FileSpreadsheet, Eye, Edit2, Trash2, FileCode, Download, Plus, Printer, RefreshCw } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { manifestService } from '../../services/manifestService';
import { useToast } from '../../context/ToastContext';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import { useAuth } from '../../context/AuthContext';

export const ManifestsList = ({ onNavigate }) => {
  const { manifests, createManifest, updateManifest, deleteManifest, fetchMenuApi } = useAppData();
  const { isAgent, currentUser } = useAuth();
  const { showToast } = useToast();
  const [editingManifest, setEditingManifest] = useState(null);
  const [deletingManifest, setDeletingManifest] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        const userPort = (currentUser?.destinationPortCode || 'NAS').toUpperCase();
        const userAgentId = currentUser?.agentId;

        if (userAgentId && mAgentId === userAgentId) return true;
        if (m.destinationCode && m.destinationCode === currentUser?.destinationPortCode) return true;
        if (userPort && (mPort.includes(userPort) || mPort.includes('NASSAU') || mPort.includes('BAHAMAS'))) return true;
        return true;
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
            {item.portOfLoading} → {item.portOfDischarge}
          </div>
        </div>
      )
    },
    {
      header: 'Vessel & Voyage',
      accessor: 'vesselName',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{item.vesselName}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.voyageNumber} • {item.carrier}</div>
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
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('manifests', item.id);
            }}
            className="btn btn-sm btn-outline"
            style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem' }}
            title="View Manifest Details"
          >
            <Eye size={13} />
            <span>View</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('manifests', item.id);
              setTimeout(() => window.print(), 300);
            }}
            className="btn btn-sm btn-secondary"
            title="Print Manifest"
            style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem' }}
          >
            <Printer size={13} />
            <span>Print</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              manifestService.exportCsv(item);
              showToast(`Exported CSV for ${item.manifestNumber}.`, 'success', 'CSV Exported');
            }}
            className="btn btn-sm btn-ghost"
            title="Export Manifest CSV / XML"
            style={{ padding: '0.25rem 0.45rem', color: '#0284C7', fontWeight: 600, fontSize: '0.78rem' }}
          >
            <Download size={13} />
            <span>Export</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingManifest(item);
            }}
            className="btn btn-sm btn-ghost"
            title="Edit Manifest"
            style={{ padding: '0.25rem 0.45rem' }}
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingManifest(item);
            }}
            className="btn btn-sm btn-ghost"
            title="Delete Manifest"
            style={{ padding: '0.25rem 0.45rem', color: '#EF4444' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

      <ResponsiveTable
        columns={columns}
        data={visibleManifests}
        searchPlaceholder="Search manifests, vessel, voyage, destination..."
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

