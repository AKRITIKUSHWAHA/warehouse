import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Ship, Eye, ArrowRight, FileText, Lock, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { agentPortalService } from '../../services/agentPortalService';
import { useToast } from '../../context/ToastContext';

export const AgentShipmentsList = ({ onNavigate }) => {
  const { showToast } = useToast();

  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchShipments = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await agentPortalService.getShipments({ limit: 100 });
      setShipments(res.data || []);
    } catch (err) {
      console.error('Failed to load agent shipments from API:', err);
      setError(err.message || 'Failed to fetch assigned shipments from backend');
      showToast(err.message || 'Error loading shipments from server', 'danger', 'API Error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const columns = [
    {
      header: 'Shipment #',
      accessor: 'shipmentNumber',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.shipmentNumber}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 600 }}>
            Trk: {item.trackingNumber}
          </div>
        </div>
      )
    },
    {
      header: 'Vessel / Carrier',
      accessor: 'vesselName',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600 }}>{item.vesselName}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.carrier}</div>
        </div>
      )
    },
    {
      header: 'Container & Seal',
      accessor: 'containerNumber',
      render: (item) => (
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 600 }}>
            {item.containerNumber}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Seal: {item.sealNumber}</div>
        </div>
      )
    },
    {
      header: 'Cargo Volume',
      accessor: 'totalCbm',
      render: (item) => (
        <div>
          <strong>{item.totalCbm} CBM</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            {item.totalPackages} pkgs ({Number(item.totalWeightLbs || 0).toLocaleString()} lbs{item.totalCft ? ` • ${item.totalCft} CFT` : ''})
          </div>
        </div>
      )
    },
    {
      header: 'Estimated Arrival (ETA)',
      accessor: 'eta',
      render: (item) => (
        <span style={{ fontWeight: 700, color: '#0284C7' }}>{item.eta}</span>
      )
    },
    {
      header: 'Shipment Status',
      accessor: 'status',
      render: (item) => <StatusBadge status={item.status} />
    },
    {
      header: 'B/L Status',
      accessor: 'blStatus',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <StatusBadge status={item.blStatus || 'Released'} />
          {(item.blStatus === 'On Hold') && <Lock size={13} style={{ color: '#EF4444' }} />}
        </div>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('agent-bl-detail', item.billOfLadingNumber || item.billOfLadingId || item.id);
          }}
          className="btn btn-sm btn-primary"
          style={{ padding: '0.25rem 0.6rem' }}
        >
          <FileText size={13} />
          <span>Access B/L</span>
        </button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        title="My Assigned Consignments"
        subtitle="Inbound shipments assigned to your destination port hub."
        icon={Ship}
        breadcrumbs={[
          { label: 'Agent Portal', href: '#' },
          { label: 'My Shipments' }
        ]}
        actions={
          <button
            onClick={() => fetchShipments(true)}
            className="btn btn-outline btn-sm"
            disabled={isRefreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh List'}</span>
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
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchShipments()} className="btn btn-sm btn-danger">
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '3rem 1rem', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: '#0284C7' }} />
          <div style={{ color: '#64748B', fontSize: '0.875rem', fontWeight: 600 }}>
            Loading shipments from PostgreSQL database...
          </div>
        </div>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={shipments}
          searchPlaceholder="Search assigned shipments, container, vessel..."
          pageSize={6}
          onRowClick={(item) => onNavigate('agent-bl-detail', item.billOfLadingNumber || item.billOfLadingId || item.id)}
        />
      )}
    </div>
  );
};
