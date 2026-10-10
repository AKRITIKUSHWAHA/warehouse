import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CustomerModal } from '../../components/modals/CustomerModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import {
  Building2,
  ArrowLeft,
  Edit2,
  Trash2,
  Package,
  FileText,
  MapPin,
  Phone,
  Mail,
  Anchor,
  Layers,
  CheckCircle2,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { customerService } from '../../services/customerService';

export const CustomerDetail = ({ customerId, onNavigate }) => {
  const { customers, warehouseReceipts = [], houseBills = [], updateCustomer, deleteCustomer, fetchMenuApi } = useAppData();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fetchedCustomer, setFetchedCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const contextCustomer = (customers || []).find(c => c.id === customerId || c.customerNumber === customerId || c.name === customerId);
  const customer = contextCustomer || fetchedCustomer;

  React.useEffect(() => {
    if (!contextCustomer && customerId) {
      setIsLoading(true);
      customerService.getCustomerById(customerId)
        .then(res => {
          if (res) setFetchedCustomer(res);
        })
        .finally(() => setIsLoading(false));
    }
  }, [contextCustomer, customerId]);

  React.useEffect(() => {
    if (fetchMenuApi) {
      fetchMenuApi('house-bills');
      fetchMenuApi('warehouse-receipts');
    }
  }, [fetchMenuApi, customerId]);

  if (!customer) {
    if (isLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748B' }}>
          Loading customer profile...
        </div>
      );
    }
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h3>Customer Profile Not Found</h3>
        <button onClick={() => onNavigate('customers')} className="btn btn-primary btn-sm mt-4">
          Back to Customers List
        </button>
      </div>
    );
  }

  const custNameLower = (customer.name || '').trim().toLowerCase();
  const custId = customer.id;
  const custNum = customer.customerNumber;

  // Linked Warehouse Receipts
  const linkedWrs = (warehouseReceipts || []).filter(
    w => (custId && w.customerId === custId) ||
         (custNum && w.customerId === custNum) ||
         (custNameLower && (w.customer || w.customerName || '').trim().toLowerCase() === custNameLower)
  );

  // Linked House Bills
  const linkedHbls = (houseBills || []).filter(
    h => (custId && h.customerId === custId) ||
         (custNum && h.customerId === custNum) ||
         (custNameLower && (h.customerName || (typeof h.consignee === 'object' ? h.consignee?.name : h.consignee) || '').trim().toLowerCase() === custNameLower)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title={customer.name}
        subtitle={`Customer Account ${customer.customerNumber || customer.id} — ${customer.destinationPort}`}
        icon={Building2}
        breadcrumbs={[
          { label: 'Customers', href: '#' },
          { label: customer.name }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('customers')} className="btn btn-outline btn-sm">
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
            <button
              onClick={() => onNavigate('warehouse-receipts', 'create')}
              className="btn btn-primary btn-sm"
            >
              <Package size={15} />
              <span>Intake Warehouse Receipt</span>
            </button>
            <button
              onClick={() => onNavigate('house-bills', 'create')}
              className="btn btn-outline btn-sm"
            >
              <FileText size={15} />
              <span>Create House B/L</span>
            </button>
            <button onClick={() => setShowEditModal(true)} className="btn btn-secondary btn-sm">
              <Edit2 size={15} />
              <span>Edit Profile</span>
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="btn btn-danger btn-sm">
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        }
      />

      {/* Customer Profile Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column: Profile Card */}
        <div style={{ gridColumn: 'span 4' }} className="col-span-4-mobile">
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>ACCOUNT ID</span>
                <div style={{ fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#0A192F', fontSize: '1.1rem' }}>
                  {customer.customerNumber || customer.id}
                </div>
              </div>
              <StatusBadge status={customer.status || 'Active'} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>


              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>DELIVERY / HEADQUARTERS ADDRESS</span>
                <div style={{ color: '#334155', display: 'flex', alignItems: 'flex-start', gap: '4px', marginTop: '2px' }}>
                  <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px', color: '#64748B' }} />
                  <span>{customer.address}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>CONTACT PERSON</span>
                <div style={{ fontWeight: 600, color: '#0A192F', marginTop: '2px' }}>
                  {customer.contactPerson || 'General Inquiries'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>PHONE</span>
                  <div style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Phone size={12} />
                    <span>{customer.telephone || customer.phone || '—'}</span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>TAX ID / TIN</span>
                  <div style={{ fontWeight: 600, color: '#0A192F', marginTop: '2px' }}>
                    {customer.taxId || 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>EMAIL</span>
                <div style={{ color: '#0284C7', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Mail size={12} />
                  <a href={`mailto:${customer.email}`} style={{ color: '#0284C7', textDecoration: 'none' }}>{customer.email}</a>
                </div>
              </div>

              {customer.notes && (
                <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>SPECIAL INSTRUCTIONS</span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#475569' }}>{customer.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Linked Warehouse Receipts & House Bills */}
        <div style={{ gridColumn: 'span 8' }} className="col-span-8-mobile">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Linked Warehouse Receipts Table */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={18} style={{ color: '#D97706' }} />
                  <h3 style={{ fontSize: '1rem', color: '#0A192F', margin: 0 }}>
                    Linked Warehouse Receipts ({linkedWrs.length})
                  </h3>
                </div>
                <button
                  onClick={() => onNavigate('warehouse-receipts', 'create')}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  <Plus size={13} />
                  <span>New WR</span>
                </button>
              </div>

              {linkedWrs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B', fontSize: '0.85rem' }}>
                  No Warehouse Receipts found for this customer account.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Receipt #</th>
                        <th>Intake Date</th>
                        <th>Packages / Pieces</th>
                        <th>Volume (CFT / CBM)</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedWrs.map(wr => (
                        <tr
                          key={wr.id}
                          onClick={() => onNavigate('warehouse-receipts', wr.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ fontWeight: 700, color: '#D97706', fontFamily: 'JetBrains Mono, monospace' }}>
                            {wr.receiptNumber}
                          </td>
                          <td>{wr.date}</td>
                          <td>{wr.packages?.length || wr.packageCount} pkgs ({wr.totalPieces || wr.packageCount} pcs)</td>
                          <td style={{ fontWeight: 700, color: '#D97706' }}>{wr.cft} CFT <span style={{ color: '#0284C7', fontWeight: 600 }}>({wr.cbm} CBM)</span></td>
                          <td><StatusBadge status={wr.status} size="sm" /></td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate('warehouse-receipts', wr.id);
                              }}
                              className="btn btn-sm btn-ghost"
                              style={{ color: '#0284C7' }}
                            >
                              <ExternalLink size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Linked House Bills of Lading Table */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} style={{ color: '#2563EB' }} />
                  <h3 style={{ fontSize: '1rem', color: '#0A192F', margin: 0 }}>
                    Issued House Bills of Lading ({linkedHbls.length})
                  </h3>
                </div>
                <button
                  onClick={() => onNavigate('house-bills', 'create')}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  <Plus size={13} />
                  <span>Issue House B/L</span>
                </button>
              </div>

              {linkedHbls.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B', fontSize: '0.85rem' }}>
                  No House Bills of Lading issued yet for this customer.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>HBL #</th>
                        <th>Issue Date</th>
                        <th>Linked WRs</th>
                        <th>Total Cargo</th>
                        <th>Volume</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedHbls.map(hbl => (
                        <tr
                          key={hbl.id}
                          onClick={() => onNavigate('house-bills', hbl.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ fontWeight: 800, color: '#2563EB', fontFamily: 'JetBrains Mono, monospace' }}>
                            {hbl.hblNumber}
                          </td>
                          <td>{hbl.issueDate || hbl.createdDate}</td>
                          <td>{hbl.warehouseReceiptIds?.length || 1} WR(s)</td>
                          <td>{hbl.totalPieces || hbl.totalPackages} pieces • {hbl.totalWeightLbs?.toLocaleString()} lbs</td>
                          <td style={{ fontWeight: 700, color: '#0284C7' }}>{hbl.totalCbm} CBM</td>
                          <td><StatusBadge status={hbl.status} size="sm" /></td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate('house-bills', hbl.id);
                              }}
                              className="btn btn-sm btn-ghost"
                              style={{ color: '#2563EB' }}
                            >
                              <ExternalLink size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Customer Modal */}
      <CustomerModal
        isOpen={showEditModal}
        isEdit={true}
        customer={customer}
        onClose={() => setShowEditModal(false)}
        onSave={async (updates) => {
          const res = await updateCustomer(customer.id, updates);
          if (res) {
            setFetchedCustomer(prev => ({ ...(prev || {}), ...res, ...updates }));
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        itemName={customer.name}
        itemType="Customer Profile"
        onConfirm={async () => {
          await deleteCustomer(customer.id);
          onNavigate('customers');
        }}
      />
    </div>
  );
};
