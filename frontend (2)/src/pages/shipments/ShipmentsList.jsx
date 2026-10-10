import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShipmentModal } from '../../components/modals/ShipmentModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import { Ship, Plus, Eye, Edit2, Trash2, Search, ArrowRight, Anchor, FileText, RefreshCw } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';

export const ShipmentsList = ({ onNavigate }) => {
  const { shipments, createShipment, updateShipment, deleteShipment, fetchMenuApi } = useAppData();
  const { isAgent, currentUser } = useAuth();
  const [editingShipment, setEditingShipment] = useState(null);
  const [deletingShipment, setDeletingShipment] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if ((!shipments || shipments.length === 0) && fetchMenuApi) {
      fetchMenuApi('shipments');
    }
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (fetchMenuApi) await fetchMenuApi('shipments');
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filter if Agent
  const visibleShipments = isAgent 
    ? shipments.filter(s => !currentUser?.agentId || !s.agentId || s.agentId === currentUser?.agentId || s.destinationCode === currentUser?.destinationPortCode || s.destinationCode === 'NAS' || s.destinationPort?.includes('Nassau'))
    : shipments;

  const columns = [
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
          <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.vesselName}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.containerNumber} ({item.containerType})
          </div>
        </div>
      )
    },
    {
      header: 'Voyage / ETD-ETA',
      accessor: 'voyageNumber',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.78rem' }}>{item.voyageNumber}</div>
          <div style={{ fontSize: '0.72rem', color: '#0284C7' }}>
            {item.etd} â†’ {item.eta}
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
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('shipments', item.id || item.shipmentNumber);
            }}
            className="btn btn-sm btn-primary"
            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
          >
            <Eye size={13} />
            <span>View</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('tracking', item.trackingNumber);
            }}
            className="btn btn-sm btn-outline"
            title="Track Consignment Milestones"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          >
            <Search size={13} />
            <span>Track</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingShipment(item);
            }}
            className="btn btn-sm btn-secondary"
            title="Edit Shipment"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          >
            <Edit2 size={13} />
            <span className="hide-mobile">Edit</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingShipment(item);
            }}
            className="btn btn-sm btn-ghost"
            title="Delete Shipment"
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
        title="Master Shipments"
        subtitle="Track ocean freight containers, vessel schedules, and transit milestones."
        icon={Ship}
        breadcrumbs={[
          { label: 'Operations', href: '#' },
          { label: 'Shipments' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handleManualRefresh}
              className="btn btn-outline btn-sm"
              title="Refresh Shipments from Database"
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
                <span>Create Shipment</span>
              </button>
            )}
          </div>
        }
      />

      <WorkflowIndicator currentStage="shipments" onNavigate={onNavigate} />

      <ResponsiveTable
        columns={columns}
        data={visibleShipments}
        searchPlaceholder="Search by shipment #, tracking #, destination, vessel..."
        filterOptions={['All', 'In Transit', 'Loaded & Sealed', 'Delivered']}
        pageSize={8}
        emptyTitle="No Shipments Found"
        emptyWhy="No ocean freight shipments match your search or filter."
        emptyNextStep="Create a shipment or build a consolidation from staged warehouse cargo."
        emptyActionLabel="Create Shipment"
        onEmptyAction={() => setShowAddModal(true)}
        onRowClick={(item) => onNavigate('shipments', item.id || item.shipmentNumber)}
      />

      {/* Add Direct Shipment Modal */}
      <ShipmentModal
        isOpen={showAddModal}
        isEdit={false}
        onClose={() => setShowAddModal(false)}
        onSave={async (newShipmentData) => {
          await createShipment(newShipmentData);
        }}
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


