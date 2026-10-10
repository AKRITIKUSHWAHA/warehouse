import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import { ContainerFillBar } from '../../components/common/ContainerFillBar';
import { ConsolidationModal } from '../../components/modals/ConsolidationModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { Layers, Plus, Eye, Edit2, Trash2, Ship, Box, ArrowRight, RefreshCw } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';

export const ConsolidationsList = ({ onNavigate }) => {
  const { consolidations, shipments, updateConsolidation, deleteConsolidation, refreshAll, fetchMenuApi } = useAppData();
  const { isAgent, currentUser } = useAuth();
  const [editingConsolidation, setEditingConsolidation] = useState(null);
  const [deletingConsolidation, setDeletingConsolidation] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if ((!consolidations || consolidations.length === 0) && fetchMenuApi) {
      fetchMenuApi('consolidations');
    }
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (fetchMenuApi) await fetchMenuApi('consolidations');
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filter if Agent
  const visibleConsolidations = isAgent 
    ? consolidations.filter(c => 
        !currentUser?.agentId || 
        !c.agentId || 
        c.agentId === currentUser?.agentId || 
        (currentUser?.destinationPortCode && c.destinationCode === currentUser?.destinationPortCode) || 
        (currentUser?.destinationPortCode && c.destinationPort?.includes(currentUser.destinationPortCode)) || 
        c.destinationPort?.includes('NAS') || 
        c.destinationPort?.includes('Nassau')
      ) 
    : consolidations;

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
      header: 'Title & Destination',
      accessor: 'title',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0A192F' }}>{item.title}</div>
          <div style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 600 }}>{item.destinationPort}</div>
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
      header: 'Vessel / Voyage',
      accessor: 'vesselName',
      render: (item) => (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.vesselName}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.voyageNumber} • {item.carrier}</div>
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
      header: 'Container Fill',
      accessor: 'containerFillPercentage',
      render: (item) => (
        <div style={{ minWidth: '130px' }}>
          <ContainerFillBar
            fillPercentage={item.containerFillPercentage}
            currentCbm={item.totalCbm}
            maxCbm={item.containerCapacityCbm || 76.2}
            containerType={item.containerType}
          />
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
        const liveStatus = linkedShipment?.status || item.status || 'Planning';
        return <StatusBadge status={liveStatus} />;
      }
    },
    {
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
          {isAgent && (
            <select
              className="form-select form-select-sm"
              style={{ width: '160px', padding: '0.15rem 0.5rem', fontSize: '0.75rem', marginRight: '0.5rem' }}
              value={item.status}
              onClick={(e) => e.stopPropagation()}
              onChange={async (e) => {
                const newStatus = e.target.value;
                await updateConsolidation(item.id, { ...item, status: newStatus });
              }}
            >
              <option value="In Transit">In Transit</option>
              <option value="Arrived at Port">Arrived at Port</option>
              <option value="Container Unloaded">Container Unloaded</option>
              <option value="Documents Released">Documents Released</option>
            </select>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingConsolidation(item);
            }}
            className="btn btn-sm btn-outline"
            title="View Consolidation Details"
            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
          >
            <Eye size={13} />
            <span>View</span>
          </button>

          {!isAgent && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingConsolidation(item);
                }}
                className="btn btn-sm btn-secondary"
                title="Edit Consolidation"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                <Edit2 size={13} />
                <span className="hide-mobile">Edit</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingConsolidation(item);
                }}
                className="btn btn-sm btn-ghost"
                title="Delete Consolidation"
                style={{ padding: '0.25rem 0.45rem', color: '#EF4444' }}
              >
                <Trash2 size={13} />
              </button>
            </>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (item.assignedShipmentId) {
                onNavigate('shipments', item.assignedShipmentId);
              } else {
                onNavigate('bills-of-lading');
              }
            }}
            className="btn btn-sm btn-primary"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            title="Continue to Master Shipment & B/L stage"
          >
            <span>Continue</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )
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
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handleManualRefresh}
              className="btn btn-outline btn-sm"
              title="Refresh Consolidations from Database"
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hide-mobile">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
            {!isAgent && (
              <button
                onClick={() => onNavigate('consolidations', 'create')}
                className="btn btn-primary btn-sm"
              >
                <Plus size={15} />
                <span>Build Consolidation</span>
              </button>
            )}
          </div>
        }
      />

      <WorkflowIndicator currentStage="consolidations" onNavigate={onNavigate} />

      <ResponsiveTable
        columns={columns}
        data={visibleConsolidations}
        searchPlaceholder="Search consolidations, container #, vessel, destination..."
        filterOptions={['All', 'Loaded', 'Sealed', 'Draft']}
        pageSize={8}
        emptyTitle="No Consolidations Found"
        emptyWhy="No ocean container consolidations match your search or filter."
        emptyNextStep="Select staged cargo from the warehouse to build a new container consolidation."
        emptyActionLabel="Build Consolidation"
        onEmptyAction={() => onNavigate('consolidations', 'create')}
        onRowClick={(item) => {
          if (item.assignedShipmentId) {
            onNavigate('shipments', item.assignedShipmentId);
          }
        }}
      />

      {/* Edit Modal */}
      <ConsolidationModal
        isOpen={!!editingConsolidation}
        consolidation={editingConsolidation}
        onClose={() => setEditingConsolidation(null)}
        onSave={async (updates) => {
          await updateConsolidation(editingConsolidation.id, updates);
        }}
      />

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

