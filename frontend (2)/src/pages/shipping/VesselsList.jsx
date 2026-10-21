import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { VesselModal } from '../../components/modals/VesselModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { Anchor, Plus, Edit2, Trash2 } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const VesselsList = ({ onNavigate }) => {
  const { vessels = [], createVessel, updateVessel, deleteVessel } = useAppData();

  const [showAddVessel, setShowAddVessel] = useState(false);
  const [editingVessel, setEditingVessel] = useState(null);
  const [deletingVessel, setDeletingVessel] = useState(null);

  const vesselColumns = [
    {
      header: 'Vessel Name',
      accessor: 'name',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Anchor size={16} style={{ color: '#0284C7', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#0A192F', fontSize: '0.95rem' }}>
              {item.name}
            </div>
            {item.carrier && (
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.carrier}</div>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Vessel Classification / Type',
      accessor: 'type',
      render: (item) => (
        <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 500 }}>
          {item.type || 'Merchant Vessel'}
        </span>
      )
    },
    {
      header: 'Notes',
      accessor: 'notes',
      render: (item) => (
        <span style={{ fontSize: '0.825rem', color: '#64748B' }}>
          {item.notes || '—'}
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
              setEditingVessel(item);
            }}
            className="btn btn-sm btn-secondary"
            title="Edit Vessel"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <Edit2 size={13} />
            <span className="hide-mobile">Edit</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingVessel(item);
            }}
            className="btn btn-sm btn-ghost"
            title="Delete Vessel"
            style={{ padding: '0.25rem 0.5rem', color: '#EF4444' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Fleet Directory"
        subtitle="Manage directory of ocean vessels and carriers used for bookings and cargo consolidations."
        icon={Anchor}
        breadcrumbs={[
          { label: 'Logistics', href: '#' },
          { label: 'Fleet Directory' }
        ]}
        actions={
          <button
            onClick={() => setShowAddVessel(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} />
            <span>Add Vessel</span>
          </button>
        }
      />

      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#0A192F', margin: 0, fontWeight: 700 }}>Registered Vessels</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>
              Vessels available for selection across Consolidations, Master B/Ls, and Manifests.
            </p>
          </div>
          <button
            onClick={() => setShowAddVessel(true)}
            className="btn btn-sm btn-primary"
          >
            <Plus size={13} />
            <span>Add Vessel</span>
          </button>
        </div>

        <ResponsiveTable
          columns={vesselColumns}
          data={vessels}
          searchPlaceholder="Search vessel name or notes..."
          pageSize={10}
          emptyMessage="No vessels registered in the fleet directory. Click '+ Add Vessel' to register your first vessel."
        />
      </div>

      {/* Add / Edit Vessel Modal */}
      <VesselModal
        isOpen={showAddVessel}
        isEdit={false}
        onClose={() => setShowAddVessel(false)}
        onSave={async (newVesselData) => {
          await createVessel(newVesselData);
        }}
      />
      <VesselModal
        isOpen={!!editingVessel}
        vessel={editingVessel}
        isEdit={true}
        onClose={() => setEditingVessel(null)}
        onSave={async (updates) => {
          await updateVessel(editingVessel.id || editingVessel.name, updates);
        }}
      />
      <DeleteConfirmModal
        isOpen={!!deletingVessel}
        onClose={() => setDeletingVessel(null)}
        itemName={deletingVessel?.name}
        itemType="Vessel"
        onConfirm={async () => {
          await deleteVessel(deletingVessel.id || deletingVessel.name);
        }}
      />
    </div>
  );
};
