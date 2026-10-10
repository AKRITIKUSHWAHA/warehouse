import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DocumentUploadModal } from '../../components/modals/DocumentUploadModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import {
  FileStack,
  FileText,
  FileSpreadsheet,
  Package,
  Printer,
  Download,
  Eye,
  Trash2,
  Plus,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { canAccessDocumentType, hasModulePermission } from '../../config/rolePermissions';

export const DocumentCenter = ({ onNavigate }) => {
  const {
    warehouseReceipts = [],
    billsOfLading = [],
    manifests = [],
    houseBills = [],
    documents: ctxDocuments = [],
    uploadDocument,
    deleteDocument
  } = useAppData();

  const { showToast } = useToast();
  const { currentUser, isAgent } = useAuth();
  const roleKey = currentUser?.roleKey || (isAgent ? 'agent' : 'super_admin');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState(null);

  // Manage uploaded supporting documents with localStorage persistence
  const [localDocs, setLocalDocs] = useState(() => {
    try {
      const stored = localStorage.getItem('vicustoms_uploaded_docs');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read stored docs', e);
    }
    return [
      {
        id: 'doc-seed-1',
        docNumber: 'INV-2026-4401',
        docType: 'Commercial Invoice',
        title: 'Commercial Invoice for Auto Parts Miami',
        party: 'Auto Parts Miami Corp',
        date: '2026-10-02',
        status: 'Active',
        fileName: 'commercial_invoice_4401.pdf'
      },
      {
        id: 'doc-seed-2',
        docNumber: 'EXD-2026-1099',
        docType: 'Customs Export Declaration',
        title: 'Export Declaration SED #9910',
        party: 'Tropical Wholesale Supplies',
        date: '2026-10-03',
        status: 'Active',
        fileName: 'customs_export_dec_1099.pdf'
      }
    ];
  });

  const mergedUploadedDocs = useMemo(() => {
    const combined = [...localDocs];
    ctxDocuments.forEach((d) => {
      if (!combined.some((item) => item.id === d.id || item.docNumber === d.docNumber)) {
        combined.push(d);
      }
    });
    return combined;
  }, [localDocs, ctxDocuments]);

  // Build document list strictly filtered by Role Access according to client requirements
  const allDocs = useMemo(() => {
    const docs = [];

    // 1. Warehouse Receipts (Available to: Warehouse, Operations, Documentation, Admin, Agent)
    if (canAccessDocumentType(roleKey, 'WR')) {
      warehouseReceipts.forEach((w) => {
        docs.push({
          id: w.id,
          docNumber: w.receiptNumber,
          docType: 'Warehouse Receipt',
          type: 'Warehouse Receipt',
          entityType: 'WR',
          title: `CFS Intake (${w.packageCount || 1} ${w.packageType || 'Pkg'})`,
          date: w.date || w.createdAt?.split('T')[0] || '2026-10-04',
          party: w.customer || 'Direct Shipper',
          status: w.status || 'Active',
          isOnHold: false,
          raw: w
        });
      });
    }

    // 2. House Bills of Lading (Prepared by Warehouse/Operations, reviewed by Documentation)
    if (canAccessDocumentType(roleKey, 'HBL')) {
      const filteredHBLs = isAgent
        ? houseBills.filter((h) => h.agentId === currentUser?.agentId || h.portOfDischarge?.includes('Nassau'))
        : houseBills;

      filteredHBLs.forEach((h) => {
        docs.push({
          id: h.id,
          docNumber: h.hblNumber,
          docType: 'House Bill of Lading',
          type: 'House Bill of Lading',
          entityType: 'HBL',
          title: `HBL to ${h.consignee?.name || h.customerName || 'Consignee'}`,
          date: h.createdDate || h.issueDate || '2026-10-04',
          party: h.customerName || 'Shipper',
          status: h.status || 'Draft',
          isOnHold: h.status === 'On Hold' || h.holdDetails?.isOnHold,
          raw: h
        });
      });
    }

    // 3. Master Bills of Lading (Exclusive to: Documentation, Super Admin, and assigned Port Agents)
    if (canAccessDocumentType(roleKey, 'BL')) {
      billsOfLading.forEach((b) => {
        docs.push({
          id: b.id,
          docNumber: b.blNumber,
          docType: 'Bill of Lading (Master B/L)',
          type: 'Bill of Lading (Master B/L)',
          entityType: 'BL',
          title: `Master B/L to ${b.consignee?.name || 'Consignee'}`,
          date: b.issueDate || b.createdDate || '2026-10-04',
          party: b.consignee?.name || 'Nassau Consignee',
          status: b.status || 'Draft',
          isOnHold: b.status === 'On Hold' || b.holdDetails?.isOnHold,
          raw: b
        });
      });
    }

    // 4. Shipping / Ocean Manifests (Exclusive to: Documentation, Super Admin, and assigned Agents)
    if (canAccessDocumentType(roleKey, 'MANIFEST')) {
      const filteredManifests = isAgent
        ? manifests.filter((m) => m.portOfDischarge?.includes('Nassau') || m.agentId === currentUser?.agentId)
        : manifests;

      filteredManifests.forEach((m) => {
        docs.push({
          id: m.id,
          docNumber: m.manifestNumber,
          docType: 'Shipping Manifest',
          type: 'Shipping Manifest',
          entityType: 'MANIFEST',
          title: `Ocean Manifest — ${m.vesselName || 'Vessel'} (${m.voyageNumber || 'Voyage'})`,
          date: m.createdAt?.split(' ')[0] || m.createdAt?.split('T')[0] || '2026-10-04',
          party: `${m.portOfLoading || 'Origin'} → ${m.portOfDischarge || 'Destination'}`,
          status: (m.status || '').includes('Hold') ? 'On Hold' : 'Generated',
          isOnHold: (m.status || '').includes('Hold'),
          raw: m
        });
      });
    }

    // 5. Uploaded Supporting Documents (Invoices, Export Declarations, Cargo Photos)
    mergedUploadedDocs.forEach((d) => {
      docs.push({
        id: d.id,
        docNumber: d.docNumber,
        docType: d.docType || 'Supporting Document',
        type: d.docType || 'Supporting Document',
        entityType: 'UPLOAD',
        title: d.title || `${d.docType} Attachment`,
        date: d.date || '2026-10-04',
        party: d.party || 'Consignment Party',
        status: d.status || 'Active',
        isOnHold: false,
        raw: d
      });
    });

    return docs;
  }, [
    roleKey,
    isAgent,
    currentUser,
    warehouseReceipts,
    houseBills,
    billsOfLading,
    manifests,
    mergedUploadedDocs
  ]);

  // Compute dynamic filter options based strictly on documents accessible to the active role
  const dynamicFilterOptions = useMemo(() => {
    const types = new Set(allDocs.map((d) => d.docType));
    return ['All', ...Array.from(types)];
  }, [allDocs]);

  // Safe navigation handler checking role permissions before tab transition
  const handleViewDocument = (item) => {
    if (item.entityType === 'WR') {
      if (hasModulePermission(roleKey, 'warehouse-receipts')) {
        onNavigate('warehouse-receipts', item.id);
      } else {
        showToast('Restricted: You do not have permission to view Warehouse Receipts.', 'warning', 'Access Restricted');
      }
    } else if (item.entityType === 'HBL') {
      if (hasModulePermission(roleKey, 'house-bills')) {
        onNavigate('house-bills', item.id);
      } else {
        showToast('Restricted: You do not have permission to view House Bills.', 'warning', 'Access Restricted');
      }
    } else if (item.entityType === 'BL') {
      if (hasModulePermission(roleKey, 'bills-of-lading')) {
        onNavigate('bills-of-lading', item.id);
      } else {
        showToast('Restricted: Master Bills of Lading are managed exclusively by Documentation & Admin staff.', 'warning', 'Documentation Staff Only');
      }
    } else if (item.entityType === 'MANIFEST') {
      if (hasModulePermission(roleKey, 'manifests')) {
        onNavigate('manifests', item.id);
      } else {
        showToast('Restricted: Ocean Manifests are managed exclusively by Documentation & Admin staff.', 'warning', 'Documentation Staff Only');
      }
    } else {
      showToast(`Viewing attached document: ${item.title} (${item.docNumber})`, 'info', 'Supporting Document');
    }
  };

  const handleDownloadPdf = (item) => {
    if (item.isOnHold) {
      showToast(`Cannot download: Document is ON HOLD. Please contact Documentation or Admin to clear the hold.`, 'danger', 'Download Restricted');
      return;
    }

    if (item.entityType === 'HBL') {
      onNavigate('house-bills', item.id);
      showToast(`Opening House B/L ${item.docNumber} for official PDF export...`, 'info', 'Generating PDF');
    } else if (item.entityType === 'WR') {
      onNavigate('warehouse-receipts', item.id);
      showToast(`Opening Warehouse Receipt ${item.docNumber} for label & PDF printing...`, 'info', 'Generating PDF');
    } else if (item.entityType === 'BL') {
      if (hasModulePermission(roleKey, 'bills-of-lading')) {
        onNavigate('bills-of-lading', item.id);
        showToast(`Opening Master B/L ${item.docNumber} for PDF generation...`, 'info', 'Generating PDF');
      } else {
        showToast('Restricted: Master B/L downloads require Documentation or Admin credentials.', 'warning', 'Access Restricted');
      }
    } else if (item.entityType === 'MANIFEST') {
      if (hasModulePermission(roleKey, 'manifests')) {
        onNavigate('manifests', item.id);
        showToast(`Opening Manifest ${item.docNumber} for export...`, 'info', 'Generating PDF');
      } else {
        showToast('Restricted: Manifest downloads require Documentation or Admin credentials.', 'warning', 'Access Restricted');
      }
    } else {
      showToast(`${item.docNumber}.pdf download initiated.`, 'success', 'PDF Ready');
    }
  };

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
        let iconColor = '#0284C7';
        if (item.entityType === 'MANIFEST') {
          Icon = FileSpreadsheet;
          iconColor = '#8B5CF6';
        } else if (item.entityType === 'WR') {
          Icon = Package;
          iconColor = '#D97706';
        } else if (item.entityType === 'HBL') {
          Icon = FileText;
          iconColor = '#2563EB';
        } else if (item.entityType === 'UPLOAD') {
          Icon = FileStack;
          iconColor = '#059669';
        }

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
            <Icon size={15} style={{ color: iconColor }} />
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
              handleDownloadPdf(item);
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
              handleViewDocument(item);
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

  const pageSubtitle =
    roleKey === 'documentation' || roleKey === 'super_admin'
      ? 'Search and retrieve all Warehouse Receipts, Master Bills of Lading, Manifests, House Bills, and Cargo Labels.'
      : 'Search and retrieve Warehouse Receipts, House Bills of Lading, and Cargo Intake Labels.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        title="Central Document Repository"
        subtitle={pageSubtitle}
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
        searchPlaceholder="Search document #, consignee, customer, receipt..."
        filterOptions={dynamicFilterOptions}
        pageSize={8}
        onRowClick={(item) => handleViewDocument(item)}
      />

      {/* Upload Document Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={async (docData) => {
          const newDoc = {
            ...docData,
            id: `doc-${Date.now()}`
          };
          const updated = [newDoc, ...localDocs];
          setLocalDocs(updated);
          try {
            localStorage.setItem('vicustoms_uploaded_docs', JSON.stringify(updated));
          } catch (e) {
            console.warn(e);
          }
          if (uploadDocument) await uploadDocument(newDoc);
          showToast(`Document ${newDoc.docNumber} attached successfully.`, 'success', 'Document Uploaded');
        }}
      />

      {/* Delete Document Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        itemName={deletingDoc?.docNumber}
        itemType="Document"
        onConfirm={async () => {
          if (!deletingDoc) return;
          const updated = localDocs.filter((d) => d.id !== deletingDoc.id);
          setLocalDocs(updated);
          try {
            localStorage.setItem('vicustoms_uploaded_docs', JSON.stringify(updated));
          } catch (e) {
            console.warn(e);
          }
          if (deleteDocument) await deleteDocument(deletingDoc.id);
          showToast(`Document ${deletingDoc.docNumber} deleted.`, 'info', 'Document Removed');
        }}
      />
    </div>
  );
};
