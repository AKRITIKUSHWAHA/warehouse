import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CargoLabelModal } from '../../components/modals/CargoLabelModal';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import { CargoModal } from '../../components/modals/CargoModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { Box, Printer, Eye, Edit2, Trash2, Plus, Package, RefreshCw } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';

export const CargoList = ({ onNavigate }) => {
  const { cargoItems, createCargo, updateCargo, deleteCargo, fetchMenuApi } = useAppData();
  const { isAgent, currentUser } = useAuth();
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [editingCargo, setEditingCargo] = useState(null);
  const [deletingCargo, setDeletingCargo] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('cargo', item.cargoNumber || item.id);
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
              setSelectedCargo(item);
            }}
            className="btn btn-sm btn-outline"
            title="Print 4x6 Cargo Thermal Roll Label"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          >
            <Printer size={13} />
            <span>Label</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingCargo(item);
            }}
            className="btn btn-sm btn-secondary"
            title="Edit Cargo Unit"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          >
            <Edit2 size={13} />
            <span className="hide-mobile">Edit</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingCargo(item);
            }}
            className="btn btn-sm btn-ghost"
            title="Delete Cargo Unit"
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

