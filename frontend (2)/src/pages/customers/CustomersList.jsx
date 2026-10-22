import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CustomerModal } from '../../components/modals/CustomerModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { Users, Plus, Eye, Edit2, Trash2, Package, MapPin, Phone, Mail, Building2, MoreVertical } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const CustomersList = ({ onNavigate }) => {
  const { customers, warehouseReceipts = [], houseBills = [], createCustomer, updateCustomer, deleteCustomer } = useAppData();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

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
          {item.destinationPort ? (
            <span style={{ fontWeight: 700, color: '#0284C7' }}>{item.destinationPort}</span>
          ) : (
            <span style={{ color: '#64748B', fontSize: '0.8rem' }}>All Ports</span>
          )}
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
          (itemLower && (
            (w.customer || w.customerName || '').trim().toLowerCase() === itemLower ||
            (w.shipper || '').toLowerCase().includes(itemLower) ||
            (w.consignee || '').toLowerCase().includes(itemLower)
          ))
        ).length;
        const hblCount = (houseBills || []).filter(h =>
          (item.id && h.customerId === item.id) ||
          (item.customerNumber && h.customerId === item.customerNumber) ||
          (itemLower && (
            (h.customerName || '').trim().toLowerCase() === itemLower ||
            (typeof h.consignee === 'object' ? h.consignee?.name : h.consignee || '').toLowerCase().includes(itemLower) ||
            (typeof h.shipper === 'object' ? h.shipper?.name : h.shipper || '').toLowerCase().includes(itemLower)
          ))
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
      width: '70px',
      render: (item) => (
        <div
          style={{ position: 'relative', display: 'inline-block', textAlign: 'right' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(activeMenuId === item.id ? null : item.id);
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
              color: activeMenuId === item.id ? '#0284C7' : '#64748B',
              background: activeMenuId === item.id ? '#F0F9FF' : 'transparent',
              border: '1px solid',
              borderColor: activeMenuId === item.id ? '#BAE6FD' : 'transparent'
            }}
            title="Options"
            aria-label="Options"
          >
            <MoreVertical size={16} />
          </button>

          {activeMenuId === item.id && (
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
                minWidth: '185px',
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
                  onNavigate('customers', item.id);
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
                  setEditingCustomer(item);
                }}
              >
                <Edit2 size={14} style={{ color: '#64748B' }} />
                <span>Edit Profile</span>
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
                  onNavigate('warehouse-receipts', 'create');
                }}
              >
                <Package size={14} style={{ color: '#0284C7' }} />
                <span>Create Receipt (WR)</span>
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
                  setDeletingCustomer(item);
                }}
              >
                <Trash2 size={14} style={{ color: '#EF4444' }} />
                <span>Delete Customer</span>
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        title="Customers"
        subtitle="Manage master shipping customer profiles (Shippers & Consignees)."
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
            try {
              await deleteCustomer(deletingCustomer.id);
            } finally {
              setDeletingCustomer(null);
            }
          }
        }}
      />
    </div>
  );
};
