import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileStack, FileText, FileSpreadsheet, Lock, Download, Eye, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { agentPortalService } from '../../services/agentPortalService';
import { useToast } from '../../context/ToastContext';

export const AgentDocuments = ({ onNavigate }) => {
  const { showToast } = useToast();

  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [blsRes, manifestsRes] = await Promise.all([
        agentPortalService.getBillsOfLading({ limit: 100 }),
        agentPortalService.getManifests({ limit: 100 }),
      ]);

      const bls = blsRes.data || [];
      const manifests = manifestsRes.data || [];

      const combinedDocs = [
        ...bls.map((b) => ({
          id: b.id || b.blNumber,
          docNumber: b.blNumber,
          docType: 'Master Bill of Lading',
          title: `Consigned to ${b.consignee?.name || 'Authorized Importer'}`,
          vessel: b.oceanVessel || 'Island Explorer',
          status: b.status,
          isOnHold: b.status === 'On Hold' || b.holdDetails?.isOnHold,
          entityType: 'BL',
          fileName: `Master_BL_${b.blNumber}.pdf`,
        })),
        ...manifests.map((m) => ({
          id: m.id || m.manifestNumber,
          docNumber: m.manifestNumber,
          docType: 'Shipping Manifest',
          title: m.title || `Outward Manifest — ${m.portOfLoading} to ${m.portOfDischarge}`,
          vessel: m.vesselName || 'Ocean Vessel',
          status: m.status.includes('Hold') ? 'On Hold' : 'Available',
          isOnHold: m.status.includes('Hold'),
          entityType: 'MANIFEST',
          fileName: `Customs_Manifest_${m.manifestNumber}.csv`,
        })),
      ];

      setDocs(combinedDocs);
    } catch (err) {
      console.error('Failed to load agent documents from API:', err);
      setError(err.message || 'Failed to fetch authorized documents from backend');
      showToast(err.message || 'Error loading documents from server', 'danger', 'API Error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDownload = (item) => {
    if (item.isOnHold) {
      showToast(
        `Access Blocked: ${item.docNumber} is currently ON HOLD by Head Office. Contact Documentation Desk for release clearance.`,
        'danger',
        'Download Locked'
      );
    } else {
      showToast(`Preparing PDF dialog for ${item.fileName || item.docNumber}. Choose "Save as PDF" to download.`, 'success', 'Document Downloaded');
      if (item.entityType === 'BL') onNavigate('bills-of-lading', item.id);
      else if (item.entityType === 'MANIFEST') onNavigate('manifests', item.id);
      else if (item.entityType === 'WR') onNavigate('warehouse-receipts', item.id);
      setTimeout(() => {
        window.print();
      }, 400);
    }
  };

  const columns = [
    {
      header: 'Document #',
      accessor: 'docNumber',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.docNumber}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.docType}</div>
        </div>
      )
    },
    {
      header: 'Consignment / Description',
      accessor: 'title',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0A192F' }}>{item.title}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.vessel}</div>
        </div>
      )
    },
    {
      header: 'Document Status',
      accessor: 'status',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <StatusBadge status={item.status} />
          {item.isOnHold && <Lock size={13} style={{ color: '#EF4444' }} />}
        </div>
      )
    },
    {
      header: 'Access & Actions',
      align: 'right',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(item);
            }}
            className={`btn btn-sm ${item.isOnHold ? 'btn-danger' : 'btn-outline'}`}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          >
            {item.isOnHold ? <Lock size={12} /> : <Download size={12} />}
            <span>{item.isOnHold ? 'Locked' : 'Download'}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (item.entityType === 'BL') onNavigate('agent-bl-detail', item.id);
              else onNavigate('manifests', item.id);
            }}
            className="btn btn-sm btn-primary"
            style={{ padding: '0.25rem 0.6rem' }}
          >
            <Eye size={13} />
            <span>Open</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        title="Agent Document Repository"
        subtitle="Access authorized shipping manifests, released bills of lading, and delivery orders."
        icon={FileStack}
        breadcrumbs={[
          { label: 'Agent Portal', href: '#' },
          { label: 'Documents' }
        ]}
        actions={
          <button
            onClick={() => fetchDocuments(true)}
            className="btn btn-outline btn-sm"
            disabled={isRefreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Documents'}</span>
          </button>
        }
      />

      {error && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#991B1B',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchDocuments()} className="btn btn-sm btn-danger">
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '3rem 1rem', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: '#0284C7' }} />
          <div style={{ color: '#64748B', fontSize: '0.875rem', fontWeight: 600 }}>
            Loading authorized documents from PostgreSQL database...
          </div>
        </div>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={docs}
          searchPlaceholder="Search agent documents, B/L #, manifest..."
          pageSize={6}
          onRowClick={(item) => {
            if (item.entityType === 'BL') onNavigate('agent-bl-detail', item.id);
            else onNavigate('manifests', item.id);
          }}
        />
      )}
    </div>
  );
};
