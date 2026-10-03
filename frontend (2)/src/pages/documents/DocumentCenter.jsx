import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DocumentUploadModal } from '../../components/modals/DocumentUploadModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { FileStack, FileText, FileSpreadsheet, Package, Printer, Download, Eye, Trash2, Plus, ShieldAlert, Filter } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';

export const DocumentCenter = ({ onNavigate }) => {
  const { warehouseReceipts, billsOfLading, manifests, documents = [], uploadDocument, deleteDocument } = useAppData();
  const { showToast } = useToast();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState(null);

  // Combine documents into a unified list
  const allDocs = [
    ...billsOfLading.map(b => ({
      id: b.id,
      docNumber: b.blNumber,
      docType: 'Bill of Lading (Master B/L)',
      entityType: 'BL',
      title: `Master B/L to ${b.consignee?.name || 'Consignee'}`,
      date: b.issueDate || b.createdDate,
      party: b.consignee?.name || 'Nassau Consignee',
      status: b.status,
      isOnHold: b.status === 'On Hold' || b.holdDetails?.isOnHold,
      raw: b
    })),
    ...manifests.map(m => ({
      id: m.id,
      docNumber: m.manifestNumber,
      docType: 'Shipping Manifest',
      entityType: 'MANIFEST',
      title: `Ocean Manifest — ${m.vesselName} (${m.voyageNumber})`,
      date: m.createdAt?.split(' ')[0] || '2026-08-28',
      party: `${m.portOfLoading} → ${m.portOfDischarge}`,
      status: m.status.includes('Hold') ? 'On Hold' : 'Generated',
      isOnHold: m.status.includes('Hold'),
      raw: m
    })),
    ...warehouseReceipts.map(w => ({
      id: w.id,
      docNumber: w.receiptNumber,
      docType: 'Warehouse Receipt',
      entityType: 'WR',
      title: `CFS Intake (${w.packageCount} ${w.packageType})`,
      date: w.date,
      party: w.customer,
      status: w.status,
      isOnHold: false,
      raw: w
    })),
    ...documents.map(d => ({
      id: d.id,
      docNumber: d.docNumber,
      docType: d.docType || 'Supporting Document',
      entityType: 'UPLOAD',
      title: d.title,
      date: d.date,
      party: d.party || 'Consignment Party',
      status: d.status || 'Active',
      isOnHold: false,
      raw: d
    }))
  ];

  const columns = [
    {
      header: 'Document #',
      accessor: 'docNumber',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.docNumber}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.date}</div>
        </div>
      )
    },
    {
      header: 'Document Type',
      accessor: 'docType',
      render: (item) => {
        let Icon = FileText;
        if (item.entityType === 'MANIFEST') Icon = FileSpreadsheet;
        if (item.entityType === 'WR') Icon = Package;
        if (item.entityType === 'UPLOAD') Icon = FileStack;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
            <Icon size={15} style={{ color: item.entityType === 'UPLOAD' ? '#059669' : '#0284C7' }} />
            <span>{item.docType}</span>
          </div>
        );
      }
    },
    {
      header: 'Reference & Consignee',
      accessor: 'title',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0A192F' }}>{item.title}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.party}</div>
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
              if (item.isOnHold) {
                showToast(`Cannot download: Document is ON HOLD.`, 'danger', 'Download Restricted');
                return;
              }
              showToast(`Preparing PDF dialog for ${item.docNumber}. Choose "Save as PDF" to download.`, 'success', 'PDF Ready');
              if (item.entityType === 'BL') onNavigate('bills-of-lading', item.id);
              else if (item.entityType === 'MANIFEST') onNavigate('manifests', item.id);
              else if (item.entityType === 'WR') onNavigate('warehouse-receipts', item.id);
              
              setTimeout(() => {
                window.print();
              }, 400);
            }}
            className={`btn btn-sm ${item.isOnHold ? 'btn-ghost disabled' : 'btn-outline'}`}
            title={item.isOnHold ? 'Hold active - locked' : 'Download Document PDF'}
            style={{ padding: '0.25rem 0.45rem' }}
          >
            <Download size={13} />
            <span className="hide-mobile">PDF</span>
          </button>
          {item.entityType === 'UPLOAD' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeletingDoc(item);
              }}
              className="btn btn-sm btn-ghost"
              title="Delete Document"
              style={{ padding: '0.25rem 0.45rem', color: '#EF4444' }}
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (item.entityType === 'BL') onNavigate('bills-of-lading', item.id);
              else if (item.entityType === 'MANIFEST') onNavigate('manifests', item.id);
              else if (item.entityType === 'WR') onNavigate('warehouse-receipts', item.id);
              else {
                showToast(`Previewing ${item.title}`, 'info', 'Document Viewer');
              }
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
        title="Central Document Repository"
        subtitle="Search and retrieve all Warehouse Receipts, Master Bills of Lading, Manifests, and Cargo Labels."
        icon={FileStack}
        breadcrumbs={[
          { label: 'Documents', href: '#' },
          { label: 'Document Center' }
        ]}
        actions={
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} />
            <span>Upload Document</span>
          </button>
        }
      />

      <ResponsiveTable
        columns={columns}
        data={allDocs}
        searchPlaceholder="Search document #, consignee, customer, vessel..."
        filterOptions={['All', 'Bill of Lading (Master B/L)', 'Shipping Manifest', 'Warehouse Receipt', 'Commercial Invoice', 'Customs Export Declaration']}
        pageSize={8}
        onRowClick={(item) => {
          if (item.entityType === 'BL') onNavigate('bills-of-lading', item.id);
          else if (item.entityType === 'MANIFEST') onNavigate('manifests', item.id);
          else if (item.entityType === 'WR') onNavigate('warehouse-receipts', item.id);
        }}
      />

      {/* Upload Document Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={async (docData) => {
          await uploadDocument(docData);
        }}
      />

      {/* Delete Document Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        itemName={deletingDoc?.docNumber}
        itemType="Document"
        onConfirm={async () => {
          await deleteDocument(deletingDoc.id);
        }}
      />
    </div>
  );
};

