import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CargoLabelModal } from '../../components/modals/CargoLabelModal';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import { CargoModal } from '../../components/modals/CargoModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { Box, Printer, Eye, Edit2, Trash2, Plus, Package, RefreshCw, MoreVertical } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';

export const CargoList = ({ onNavigate }) => {
  const { cargoItems, createCargo, updateCargo, deleteCargo, fetchMenuApi } = useAppData();
  const { isAgent, isWarehouse, currentUser } = useAuth();
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [editingCargo, setEditingCargo] = useState(null);
  const [deletingCargo, setDeletingCargo] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    if ((!cargoItems || cargoItems.length === 0) && fetchMenuApi) {
      fetchMenuApi('cargo');
    }
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (fetchMenuApi) await fetchMenuApi('cargo');
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const visibleCargo = isAgent
    ? cargoItems.filter(c => {
        const agentMatch = (
          (c.agentId && (c.agentId === currentUser?.agentId || c.agentId === '2e49c222-f24b-4233-83b8-f0cac7af07d5' || c.agentId === 'AGT-001')) ||
          (c.agentName && (c.agentName.toLowerCase().includes('caribbean express') || c.agentName.toLowerCase().includes('cartwright')))
        );
        const dest = ((c.destinationPort || '') + ' ' + (c.destinationCode || '') + ' ' + (c.destination || '')).toLowerCase();
        const portMatch = dest.includes('nas') || dest.includes('nassau');
        return agentMatch || portMatch;
      })
    : cargoItems;

  const columns = [
    {
      header: 'Cargo ID',
      accessor: 'id',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.cargoNumber || item.id}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 600 }}>
            WR: {item.receiptNumber}
          </div>
        </div>
      )
    },
    {
      header: 'Customer & Description',
      accessor: 'customer',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0A192F' }}>{item.customer}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.description}
          </div>
        </div>
      )
    },
    {
      header: 'Packages',
      accessor: 'packageCount',
      render: (item) => (
        <span style={{ fontWeight: 600 }}>
          {item.packageCount} {item.packageType}
        </span>
      )
    },
    {
      header: 'Dimensions & Volume',
      accessor: 'cbm',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0284C7' }}>{item.cbm} CBM</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            {item.lengthInches}" × {item.widthInches}" × {item.heightInches}"
          </div>
        </div>
      )
    },
    {
      header: 'Weight',
      accessor: 'weightLbs',
      render: (item) => (
        <div>
          <span style={{ fontWeight: 600 }}>{item.weightLbs?.toLocaleString()} lbs</span>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            ({(item.weightLbs * 0.453592).toFixed(1)} kg)
          </div>
        </div>
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
        const menuKey = item.id || item.cargoNumber;
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
                  minWidth: '175px',
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
                    onNavigate('cargo', item.cargoNumber || item.id);
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
                    setSelectedCargo(item);
                  }}
                >
                  <Printer size={14} style={{ color: '#D97706' }} />
                  <span>Print 4x6 Label</span>
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
                    setEditingCargo(item);
                  }}
                >
                  <Edit2 size={14} style={{ color: '#64748B' }} />
                  <span>Edit Cargo Unit</span>
                </button>

                {!isAgent && !isWarehouse && (
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
                        setDeletingCargo(item);
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
        title="Cargo Inventory"
        subtitle="Staged cargo inventory, dimensions, warehouse bay locations, and 4x6 thermal barcode labels."
        icon={Box}
        breadcrumbs={[
          { label: 'Operations', href: '#' },
          { label: 'Cargo Inventory' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handleManualRefresh}
              className="btn btn-outline btn-sm"
              title="Refresh Cargo Inventory from Database"
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hide-mobile">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
            <button
              onClick={() => onNavigate('warehouse-receipts', 'create')}
              className="btn btn-primary btn-sm"
            >
              <Plus size={15} />
              <span>Intake Warehouse Receipt</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-outline btn-sm"
            >
              <Package size={15} />
              <span>Quick Cargo Unit</span>
            </button>
          </div>
        }
      />

      <WorkflowIndicator currentStage="cargo" onNavigate={onNavigate} />

      <ResponsiveTable
        columns={columns}
        data={visibleCargo}
        searchPlaceholder="Search by Cargo ID, WR #, customer, description..."
        filterOptions={['All', 'Ready for Consolidation', 'Consolidated']}
        pageSize={8}
        emptyTitle="No Staged Cargo Yet"
        emptyWhy="No cargo units match your filter. Staged cargo appears here once received at CFS."
        emptyNextStep="Create a Warehouse Receipt to add cargo to the consolidation queue."
        emptyActionLabel="Create Warehouse Receipt"
        onEmptyAction={() => onNavigate('warehouse-receipts', 'create')}
        onRowClick={(item) => onNavigate('cargo', item.cargoNumber || item.id)}
      />

      {/* 4x6 Roll Label Modal */}
      <CargoLabelModal
        isOpen={!!selectedCargo}
        onClose={() => setSelectedCargo(null)}
        cargo={selectedCargo}
      />

      {/* Add / Intake Cargo Modal */}
      <CargoModal
        isOpen={showAddModal}
        isEdit={false}
        onClose={() => setShowAddModal(false)}
        onSave={async (newCargoData) => {
          await createCargo(newCargoData);
        }}
      />

      {/* Edit Cargo Modal */}
      <CargoModal
        isOpen={!!editingCargo}
        cargo={editingCargo}
        isEdit={true}
        onClose={() => setEditingCargo(null)}
        onSave={async (updates) => {
          await updateCargo(editingCargo.id, updates);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingCargo}
        onClose={() => setDeletingCargo(null)}
        itemName={deletingCargo?.cargoNumber || deletingCargo?.id}
        itemType="Cargo Unit"
        onConfirm={async () => {
          await deleteCargo(deletingCargo.id);
        }}
      />
    </div>
  );
};

