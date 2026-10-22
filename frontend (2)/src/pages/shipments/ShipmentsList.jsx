import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShipmentModal } from '../../components/modals/ShipmentModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import { Ship, Plus, Eye, Edit2, Trash2, Search, ArrowRight, Anchor, FileText, RefreshCw, MoreVertical } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';

export const ShipmentsList = ({ onNavigate }) => {
  const { shipments, createShipment, updateShipment, deleteShipment, fetchMenuApi } = useAppData();
  const { isAgent, currentUser } = useAuth();
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
    ? shipments.filter(s => {
        if (!currentUser?.agentId && !currentUser?.destinationPortCode) return true;
        if (currentUser?.agentId && s.agentId === currentUser.agentId) return true;
        if (currentUser?.destinationPortCode && s.destinationCode === currentUser.destinationPortCode) return true;
        return false;
      })
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
      width: '70px',
      render: (item) => {
        const menuKey = item.id || item.shipmentNumber;
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
        );
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        title="Master Shipments"
        subtitle="Track ocean freight shipments, routes, and transit milestones."
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


