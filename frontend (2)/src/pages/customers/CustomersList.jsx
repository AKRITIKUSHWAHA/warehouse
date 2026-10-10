import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CustomerModal } from '../../components/modals/CustomerModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { Users, Plus, Eye, Edit2, Trash2, Package, MapPin, Phone, Mail, Building2 } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const CustomersList = ({ onNavigate }) => {
  const { customers, warehouseReceipts = [], houseBills = [], createCustomer, updateCustomer, deleteCustomer } = useAppData();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);

  const columns = [
    {
      header: 'Customer ID',
      accessor: 'customerNumber',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.customerNumber || item.id}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Reg: {item.createdDate}
          </div>
        </div>
      )
    },
    {
      header: 'Company / Client Name',
      accessor: 'name',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0A192F', fontSize: '0.9rem' }}>{item.name}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <MapPin size={12} style={{ color: '#0284C7' }} />
            <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.address}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Contact Info',
      accessor: 'contactPerson',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: '#334155' }}>{item.contactPerson}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Phone size={11} /> {item.telephone || item.phone || '—'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Mail size={11} /> {item.email || '—'}
          </div>
        </div>
      )
    },
    {
      header: 'Destination Port',
      accessor: 'destinationPort',
      render: (item) => (
        <div>
          <span style={{ fontWeight: 700, color: '#0284C7' }}>{item.destinationPort}</span>
          {item.taxId && (
            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>TIN: {item.taxId}</div>
          )}
        </div>
      )
    },
    {
      header: 'Linked Cargo & Activity',
      accessor: 'id',
      render: (item) => {
        const itemLower = (item.name || '').trim().toLowerCase();
        const wrCount = (warehouseReceipts || []).filter(w =>
          (item.id && w.customerId === item.id) ||
          (item.customerNumber && w.customerId === item.customerNumber) ||
          (itemLower && (w.customer || w.customerName || '').trim().toLowerCase() === itemLower)
        ).length;
        const hblCount = (houseBills || []).filter(h =>
          (item.id && h.customerId === item.id) ||
          (item.customerNumber && h.customerId === item.customerNumber) ||
          (itemLower && (h.customerName || (typeof h.consignee === 'object' ? h.consignee?.name : h.consignee) || '').trim().toLowerCase() === itemLower)
        ).length;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem' }}>
            <div><strong style={{ color: '#D97706' }}>{wrCount}</strong> Warehouse Receipts</div>
            <div><strong style={{ color: '#2563EB' }}>{hblCount}</strong> House B/Ls</div>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => (
        <StatusBadge status={item.status || 'Active'} />
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
              onNavigate('warehouse-receipts', 'create');
            }}
            className="btn btn-sm btn-ghost"
            title="Create Warehouse Receipt for this customer"
            style={{ padding: '0.25rem 0.45rem', color: '#0284C7' }}
          >
            <Package size={13} />
            <span className="hide-mobile">WR</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingCustomer(item);
            }}
            className="btn btn-sm btn-secondary"
            title="Edit Customer Profile"
            style={{ padding: '0.25rem 0.45rem' }}
          >
            <Edit2 size={13} />
            <span className="hide-mobile">Edit</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingCustomer(item);
            }}
            className="btn btn-sm btn-ghost"
            title="Delete Customer"
            style={{ padding: '0.25rem 0.45rem', color: '#EF4444' }}
          >
            <Trash2 size={13} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('customers', item.id);
            }}
            className="btn btn-sm btn-primary"
            style={{ padding: '0.25rem 0.6rem' }}
          >
            <Eye size={13} />
            <span>View</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        title="Customer Profiles & Consignees"
        subtitle="Manage master shipping clients, contact directories, tax identifiers, and default destination ports."
        icon={Building2}
        breadcrumbs={[
          { label: 'Management', href: '#' },
          { label: 'Customers' }
        ]}
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} />
            <span>New Customer Profile</span>
          </button>
        }
      />

      <ResponsiveTable
        columns={columns}
        data={customers}
        searchPlaceholder="Search by customer name, ID, phone, email, destination..."
        filterOptions={['All', 'Active', 'Inactive']}
        pageSize={8}
        onRowClick={(item) => onNavigate('customers', item.id)}
      />

      {/* Add Customer Modal */}
      <CustomerModal
        isOpen={showAddModal}
        isEdit={false}
        onClose={() => setShowAddModal(false)}
        onSave={async (data) => {
          await createCustomer(data);
        }}
      />

      {/* Edit Customer Modal */}
      <CustomerModal
        isOpen={!!editingCustomer}
        isEdit={true}
        customer={editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onSave={async (updates) => {
          if (editingCustomer) {
            await updateCustomer(editingCustomer.id, updates);
            setEditingCustomer(null);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        itemName={deletingCustomer?.name}
        itemType="Customer Profile"
        onConfirm={async () => {
          if (deletingCustomer) {
            await deleteCustomer(deletingCustomer.id);
            setDeletingCustomer(null);
          }
        }}
      />
    </div>
  );
};
