import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  History,
  FileSpreadsheet,
  Eye,
  RefreshCw,
  Ship,
  CheckCircle2,
  Box,
  Scale,
  Anchor,
  Layers,
  ArrowRight,
  Clock,
  MapPin,
  Calendar,
  X,
  Activity,
  FileText,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { historyService } from '../../services/historyService';

export const ShipmentHistoryArchive = ({ onNavigate }) => {
  const { shipments, fetchMenuApi } = useAppData();
  const { showToast } = useToast();

  const [historyList, setHistoryList] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch dynamic history from backend API with local calculation fallback
  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const res = await historyService.getShipmentHistory({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      if (res && res.data) {
        setHistoryList(res.data);
        setMetrics(res.summary);
      }
    } catch (err) {
      console.warn('Failed to load history from backend API, using local fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [statusFilter]);

  // Handle Export CSV with all calculated flow columns
  const handleExportArchiveCsv = () => {
    if (!historyList || historyList.length === 0) {
      showToast('No history records available to export.', 'warning', 'Export Empty');
      return;
    }

    const headers = [
      'Shipment #',
      'Tracking #',
      'Status',
      'Flow Progress %',
      'Current Stage',
      'Origin',
      'Destination Port',
      'Vessel',
      'Voyage',
      'Container #',
      'Seal #',
      'B/L Number',
      'Packages',
      'Weight (LBS)',
      'Weight (KG)',
      'Volume (CBM)',
      'Volume (CFT)',
      'Density (kg/m3)',
      'Chargeable Wt (LBS)',
      'Transit Days',
      'ETD',
      'ETA',
      'Date'
    ];

    const rows = historyList.map(s => [
      `"${s.shipmentNumber}"`,
      `"${s.trackingNumber}"`,
      `"${s.status}"`,
      `"${s.flowProgressPercent}%"`,
      `"Stage ${s.currentStageNumber} of 6"`,
      `"${s.origin}"`,
      `"${s.destinationPort}"`,
      `"${s.vesselName || ''}"`,
      `"${s.voyageNumber || ''}"`,
      `"${s.containerNumber || ''}"`,
      `"${s.sealNumber || ''}"`,
      `"${s.billOfLadingNumber || ''}"`,
      s.totalPackages,
      s.totalWeightLbs,
      s.totalWeightKg,
      s.totalCbm,
      s.totalCft,
      s.densityKgPerCbm,
      s.chargeableWeightLbs,
      s.estimatedTransitDays,
      `"${s.etd || ''}"`,
      `"${s.eta || ''}"`,
      `"${s.createdDate || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KERS_Shipment_History_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${historyList.length} historical shipments with calculations to CSV.`, 'success', 'Report Exported');
  };

  // Filtered dataset for local search bar
  const displayedShipments = useMemo(() => {
    if (!searchQuery) return historyList;
    const q = searchQuery.toLowerCase();
    return historyList.filter(s =>
      (s.shipmentNumber && s.shipmentNumber.toLowerCase().includes(q)) ||
      (s.trackingNumber && s.trackingNumber.toLowerCase().includes(q)) ||
      (s.vesselName && s.vesselName.toLowerCase().includes(q)) ||
      (s.containerNumber && s.containerNumber.toLowerCase().includes(q)) ||
      (s.destinationPort && s.destinationPort.toLowerCase().includes(q)) ||
      (s.billOfLadingNumber && s.billOfLadingNumber.toLowerCase().includes(q)) ||
      (s.carrier && s.carrier.toLowerCase().includes(q))
    );
  }, [historyList, searchQuery]);

  const columns = [
    {
      header: 'Shipment & Tracking',
      accessor: 'shipmentNumber',
      render: (item) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <strong style={{ color: '#0A192F', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>
              {item.shipmentNumber}
            </strong>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#0284C7', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
            {item.trackingNumber}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '1px' }}>
            {item.createdDate}
          </div>
        </div>
      )
    },
    {
      header: 'Route & Port',
      accessor: 'destinationPort',
      render: (item) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontWeight: 700, color: '#0A192F', fontSize: '0.8125rem' }}>{item.destinationPort}</span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              background: '#EFF6FF',
              color: '#1D4ED8',
              padding: '2px 5px',
              borderRadius: '4px',
              border: '1px solid #DBEAFE'
            }}>
              {item.destinationCode}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '2px' }}>
            <span>From: {item.origin}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Vessel & Container',
      accessor: 'vesselName',
      render: (item) => (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Ship size={13} style={{ color: '#2563EB', flexShrink: 0 }} />
            <span>{item.vesselName || 'Ocean Carrier'}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '1px' }}>
            Voyage: {item.voyageNumber || 'N/A'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '1px', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.containerNumber ? `Box: ${item.containerNumber}` : 'Pending Container'}
          </div>
        </div>
      )
    },
    {
      header: 'Cargo Math (Calculations)',
      accessor: 'totalCbm',
      render: (item) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <strong style={{ color: '#0A192F', fontSize: '0.85rem' }}>{item.totalCbm} CBM</strong>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>({item.totalCft} CFT)</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 500, marginTop: '1px' }}>
            {item.totalWeightLbs?.toLocaleString()} LBS <span style={{ color: '#64748B', fontSize: '0.7rem' }}>({item.totalWeightKg?.toLocaleString()} KG)</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, marginTop: '1px' }}>
            {item.totalPackages} pkgs • Density: {item.densityKgPerCbm} kg/m³
          </div>
        </div>
      )
    },
    {
      header: 'Lifecycle Flow Progress',
      accessor: 'flowProgressPercent',
      render: (item) => {
        const pct = item.flowProgressPercent || 20;
        const color = pct === 100 ? '#10B981' : pct >= 75 ? '#3B82F6' : '#F59E0B';
        return (
          <div style={{ minWidth: '150px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155' }}>
                Stage {item.currentStageNumber} of 6
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color }}>
                {pct}%
              </span>
            </div>
            <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '3px' }}>
              {item.flowStages && item.flowStages[item.currentStageNumber - 1]?.name}
            </div>
          </div>
        );
      }
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
              setSelectedShipment(item);
            }}
            className="btn btn-sm btn-primary"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}
            title="Inspect complete lifecycle flow & cargo calculations"
          >
            <Activity size={13} />
            <span>View Flow</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header */}
      <PageHeader
        title="Shipment History &amp; Flow Archive"
        subtitle="Live historical consignments, end-to-end lifecycle flow progression, and dynamic freight calculation analytics."
        icon={History}
        breadcrumbs={[
          { label: 'Reports', href: '#' },
          { label: 'Shipment History' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={loadHistory}
              className="btn btn-outline btn-sm"
              disabled={isLoading}
              title="Refresh history and calculation metrics from live backend"
            >
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            <button onClick={handleExportArchiveCsv} className="btn btn-outline btn-sm">
              <FileSpreadsheet size={15} style={{ color: '#059669' }} />
              <span>Export Archive (CSV)</span>
            </button>
          </div>
        }
      />

      {/* Dynamic Calculation KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* KPI 1: Total Shipments & Completion */}
        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #2563EB', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ship size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Historical Shipments
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0A192F', lineHeight: 1.2 }}>
              {metrics ? metrics.totalShipments : historyList.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600, marginTop: '2px' }}>
              {metrics ? `${metrics.completionRatePercent}% Delivered & Complete` : '100% Verified'}
            </div>
          </div>
        </div>

        {/* KPI 2: Cargo Volume Math */}
        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #8B5CF6', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F5F3FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Volume Moved
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0A192F', lineHeight: 1.2 }}>
              {metrics ? `${metrics.totalCbm.toLocaleString()} CBM` : '0.00 CBM'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
              {metrics ? `${metrics.totalCft.toLocaleString()} CFT • ${metrics.totalPackages.toLocaleString()} pkgs` : '0 pkgs'}
            </div>
          </div>
        </div>

        {/* KPI 3: Cargo Weight Math */}
        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #D97706', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scale size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Cargo Weight
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0A192F', lineHeight: 1.2 }}>
              {metrics ? `${metrics.totalWeightLbs.toLocaleString()} LBS` : '0 LBS'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
              {metrics ? `${metrics.totalWeightKg.toLocaleString()} KG • Avg ${metrics.avgWeightPerShipmentLbs} lbs/shp` : '0 KG'}
            </div>
          </div>
        </div>

        {/* KPI 4: Active Sailing vs Delivered */}
        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #10B981', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Delivered / Cleared
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0A192F', lineHeight: 1.2 }}>
              {metrics ? metrics.deliveredCount : 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 600, marginTop: '2px' }}>
              {metrics ? `${metrics.inTransitCount} In Transit / Ocean Voyage` : 'Live Tracking'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tabs-container" style={{ margin: 0 }}>
        {['All', 'Delivered', 'In Transit', 'Loaded & Sealed', 'Cargo Received'].map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`tab-btn ${statusFilter === tab ? 'active' : ''}`}
          >
            <span>{tab}</span>
          </button>
        ))}
      </div>

      {/* Responsive Table */}
      <ResponsiveTable
        columns={columns}
        data={displayedShipments}
        searchPlaceholder="Search history by shipment #, tracking #, vessel, container..."
        pageSize={8}
        onRowClick={(item) => setSelectedShipment(item)}
      />

      {/* Shipment Lifecycle Flow & Calculation Modal */}
      {selectedShipment && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedShipment(null);
          }}
          style={{ padding: 'clamp(0.5rem, 3vw, 1.25rem)' }}
        >
          <div
            className="modal-dialog"
            style={{
              maxWidth: '780px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              background: '#FFFFFF'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="modal-header"
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #E2E8F0',
                background: '#0A192F',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{selectedShipment.shipmentNumber}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: '6px' }}>
                      {selectedShipment.trackingNumber}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                    Shipment Lifecycle Flow, Freight Math &amp; Historical Milestone Audit Chain
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShipment(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              className="modal-body"
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}
            >
              {/* Section 1: Overview Summary Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.75rem',
                  background: '#F8FAFC',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Current Status</div>
                  <div style={{ marginTop: '3px' }}><StatusBadge status={selectedShipment.status} /></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Origin Port</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0A192F', marginTop: '2px' }}>{selectedShipment.origin}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Destination</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0A192F', marginTop: '2px' }}>{selectedShipment.destinationPort} ({selectedShipment.destinationCode})</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Flow Progress</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#2563EB', marginTop: '2px' }}>
                    Stage {selectedShipment.currentStageNumber} of 6 ({selectedShipment.flowProgressPercent}%)
                  </div>
                </div>
              </div>

              {/* Section 2: Complete Freight Calculations Breakdown */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0A192F', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Scale size={16} style={{ color: '#2563EB' }} />
                  <span>Freight Calculations &amp; Volumetric Math</span>
                </h4>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem'
                  }}
                >
                  {/* Cube Math */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Cubic Volume</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0A192F', marginTop: '2px' }}>
                      {selectedShipment.totalCbm} CBM
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                      = {selectedShipment.totalCft} CFT (Cubic Feet)
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '4px' }}>
                      Formula: (L × W × H in inches ÷ 1728) or m³
                    </div>
                  </div>

                  {/* Weight Math */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Scale Weight</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0A192F', marginTop: '2px' }}>
                      {selectedShipment.totalWeightLbs?.toLocaleString()} LBS
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                      = {selectedShipment.totalWeightKg?.toLocaleString()} KG (Kilograms)
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '4px' }}>
                      Scale conversion factor: 1 lb = 0.453592 kg
                    </div>
                  </div>

                  {/* Density & Chargeable */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Cargo Density Ratio</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0A192F', marginTop: '2px' }}>
                      {selectedShipment.densityKgPerCbm} kg/m³
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                      Chargeable Wt: {selectedShipment.chargeableWeightLbs?.toLocaleString()} LBS
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '4px' }}>
                      Higher of actual vs. volumetric weight
                    </div>
                  </div>
                </div>

                {/* Additional Equipment & Voyage Details */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '0.6rem',
                    marginTop: '0.75rem',
                    background: '#EFF6FF',
                    border: '1px solid #DBEAFE',
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.78rem'
                  }}
                >
                  <div>
                    <span style={{ color: '#64748B' }}>Container #: </span>
                    <strong style={{ color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>{selectedShipment.containerNumber || 'Pending'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Seal #: </span>
                    <strong style={{ color: '#0A192F' }}>{selectedShipment.sealNumber || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Master B/L: </span>
                    <strong style={{ color: '#0A192F' }}>{selectedShipment.billOfLadingNumber || 'Pending'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Transit Duration: </span>
                    <strong style={{ color: '#2563EB' }}>{selectedShipment.estimatedTransitDays} Days (Ocean)</strong>
                  </div>
                </div>
              </div>

              {/* Section 3: End-to-End 6-Stage Lifecycle Flow */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0A192F', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <TrendingUp size={16} style={{ color: '#10B981' }} />
                  <span>End-to-End Shipment Lifecycle Flow (Stages 1 to 6)</span>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedShipment.flowStages && selectedShipment.flowStages.map((stg) => {
                    const isDone = stg.status === 'completed';
                    const isCurrent = stg.status === 'current';

                    const borderColor = isDone ? '#10B981' : isCurrent ? '#2563EB' : '#E2E8F0';
                    const badgeBg = isDone ? '#ECFDF5' : isCurrent ? '#EFF6FF' : '#F1F5F9';
                    const badgeColor = isDone ? '#059669' : isCurrent ? '#1D4ED8' : '#64748B';

                    return (
                      <div
                        key={stg.stageNumber}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.85rem',
                          background: isCurrent ? '#F0F9FF' : '#FFFFFF',
                          border: `1px solid ${borderColor}`,
                          borderRadius: '10px',
                          padding: '0.85rem 1rem',
                          boxShadow: isCurrent ? '0 4px 6px -1px rgba(37, 99, 235, 0.08)' : 'none'
                        }}
                      >
                        {/* Step Icon Badge */}
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: badgeBg,
                            color: badgeColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            flexShrink: 0,
                            marginTop: '2px',
                            border: `1.5px solid ${isDone ? '#10B981' : isCurrent ? '#3B82F6' : '#CBD5E1'}`
                          }}
                        >
                          {isDone ? <CheckCircle2 size={16} /> : stg.stageNumber}
                        </div>

                        {/* Step Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0A192F' }}>
                              Stage {stg.stageNumber}: {stg.name}
                            </div>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: badgeBg,
                                color: badgeColor
                              }}
                            >
                              {isDone ? 'Completed' : isCurrent ? 'Active Milestone' : 'Pending'}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                            {stg.subtitle}
                          </div>

                          {/* Calculation Notes */}
                          {stg.calculationNotes && (
                            <div style={{ fontSize: '0.74rem', color: '#334155', background: 'rgba(255,255,255,0.7)', border: '1px dashed #CBD5E1', borderRadius: '6px', padding: '4px 8px', marginTop: '6px' }}>
                              <strong>Flow Calculation: </strong> {stg.calculationNotes}
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '6px', fontSize: '0.7rem', color: '#64748B' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={11} /> {stg.location}
                            </span>
                            {stg.date && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={11} /> {stg.date}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="modal-footer"
              style={{
                padding: '0.875rem 1.5rem',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                All freight calculations &amp; milestones verified against operational records.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedShipment.id;
                    setSelectedShipment(null);
                    onNavigate('shipments', id);
                  }}
                  className="btn btn-outline btn-sm"
                >
                  <Eye size={14} />
                  <span>Shipment Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShipment(null)}
                  className="btn btn-primary btn-sm"
                  style={{ minWidth: '85px', justifyContent: 'center' }}
                >
                  Close Flow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
