import React, { useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { Activity, ShieldAlert, CheckCircle2, User, Clock, FileText } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const AuditTrailList = () => {
  const {
    auditLogs = [],
    warehouseReceipts = [],
    shipments = [],
    billsOfLading = [],
    houseBills = [],
    customers = [],
    consolidations = [],
    manifests = [],
    fetchMenuApi
  } = useAppData();

  React.useEffect(() => {
    if ((!auditLogs || auditLogs.length === 0) && fetchMenuApi) {
      fetchMenuApi('audit');
    }
  }, [fetchMenuApi]);

  const resolveRecordRef = (item) => {
    if (!item?.recordId || item.recordId === 'N/A') return 'N/A';
    if (!UUID_REGEX.test(item.recordId)) return item.recordId;

    const id = item.recordId;
    const mod = (item.module || '').toLowerCase();

    if (mod.includes('warehouse')) {
      const found = warehouseReceipts.find(w => w.id === id || w.receiptNumber === id);
      if (found?.receiptNumber) return found.receiptNumber;
      return `WR-${id.slice(0, 8).toUpperCase()}`;
    }
    if (mod.includes('bill of lading') || mod === 'bl') {
      const found = billsOfLading.find(b => b.id === id || b.blNumber === id);
      if (found?.blNumber) return found.blNumber;
      return `BL-${id.slice(0, 8).toUpperCase()}`;
    }
    if (mod.includes('house bill') || mod === 'hbl') {
      const found = houseBills.find(h => h.id === id || h.hblNumber === id);
      if (found?.hblNumber) return found.hblNumber;
      return `HBL-${id.slice(0, 8).toUpperCase()}`;
    }
    if (mod.includes('shipment')) {
      const found = shipments.find(s => s.id === id || s.shipmentNumber === id);
      if (found?.shipmentNumber) return found.shipmentNumber;
      return `SHP-${id.slice(0, 8).toUpperCase()}`;
    }
    if (mod.includes('manifest')) {
      const found = manifests.find(m => m.id === id || m.manifestNumber === id);
      if (found?.manifestNumber) return found.manifestNumber;
      return `MNF-${id.slice(0, 8).toUpperCase()}`;
    }
    if (mod.includes('consolidation')) {
      const found = consolidations.find(c => c.id === id || c.consolidationNumber === id);
      if (found?.consolidationNumber) return found.consolidationNumber;
      return `CNS-${id.slice(0, 8).toUpperCase()}`;
    }
    if (mod.includes('customer')) {
      const found = customers.find(c => c.id === id || c.customerNumber === id);
      if (found?.customerNumber) return found.customerNumber;
      return `CUST-${id.slice(0, 8).toUpperCase()}`;
    }

    return id.slice(0, 8).toUpperCase();
  };

  const resolveDescription = (item, cleanRef) => {
    if (!item?.description) return '';
    if (!item.recordId || !UUID_REGEX.test(item.recordId)) return item.description;

    return item.description.replace(new RegExp(item.recordId, 'gi'), cleanRef);
  };

  const enrichedAuditLogs = useMemo(() => {
    return (auditLogs || []).map(item => {
      const cleanRef = resolveRecordRef(item);
      const cleanDesc = resolveDescription(item, cleanRef);
      return {
        ...item,
        recordId: cleanRef,
        description: cleanDesc
      };
    });
  }, [auditLogs, warehouseReceipts, shipments, billsOfLading, houseBills, customers, consolidations, manifests]);

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (item) => (
        <div>
          <strong style={{ fontSize: '0.8rem', color: '#0A192F' }}>{item.timestamp}</strong>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{item.ipAddress}</div>
        </div>
      )
    },
    {
      header: 'User / Officer',
      accessor: 'user',
      render: (item) => (
        <span style={{ fontWeight: 600, color: '#0284C7' }}>{item.user || item.userName}</span>
      )
    },
    {
      header: 'Module',
      accessor: 'module',
      render: (item) => (
        <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
          {item.module}
        </span>
      )
    },
    {
      header: 'Action Taken',
      accessor: 'action',
      render: (item) => {
        const isHoldAction = item.action.includes('Hold');
        const isClearAction = item.action.includes('Cleared');
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '0.8rem', color: isHoldAction && !isClearAction ? '#DC2626' : isClearAction ? '#16A34A' : '#0A192F' }}>
            {isHoldAction && !isClearAction && <ShieldAlert size={14} />}
            {isClearAction && <CheckCircle2 size={14} />}
            <span>{item.action}</span>
          </div>
        );
      }
    },
    {
      header: 'Record Ref',
      accessor: 'recordId',
      render: (item) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#D97706', fontSize: '0.8rem' }}>
          {item.recordId}
        </span>
      )
    },
    {
      header: 'Activity Description & System Log',
      accessor: 'description',
      render: (item) => (
        <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
          {item.description}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        title="System Audit Trail &amp; Activity Log"
        subtitle="Immutable compliance log tracking cargo intake, consolidations, B/L holds, releases, and manifest generation."
        icon={Activity}
        breadcrumbs={[
          { label: 'System', href: '#' },
          { label: 'Audit Trail' }
        ]}
      />

      <ResponsiveTable
        columns={columns}
        data={enrichedAuditLogs}
        searchPlaceholder="Search user, action, module, record ID..."
        filterOptions={['All', 'Bill of Lading', 'Warehouse Receipt', 'Consolidation', 'Shipping Manifest', 'Agent Portal']}
        pageSize={8}
      />
    </div>
  );
};
