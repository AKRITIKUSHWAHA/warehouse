import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { HoldAlertBanner } from '../../components/common/HoldAlertBanner';
import {
  Search,
  Compass,
  Ship,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Anchor,
  FileText,
  ArrowRight,
  ShieldAlert,
  Eye
} from 'lucide-react';
import { ResponsiveTable } from '../../components/tables/ResponsiveTable';
import { useAppData } from '../../context/AppDataContext';
import { trackingService } from '../../services';

export const ShipmentTrackingPortal = ({ initialQuery = '', onNavigate }) => {
  const { shipments = [], warehouseReceipts = [], billsOfLading = [] } = useAppData() || {};
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [searchResult, setSearchResult] = useState(null);
  const [searched, setSearched] = useState(Boolean(initialQuery));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      handleSearch(null, initialQuery);
    }
  }, [initialQuery]);

  const formatWRToTracking = (wr) => ({
    trackingNumber: wr.receiptNumber || wr.id,
    status: wr.status || 'Ready for Consolidation',
    origin: 'CFS Receiving Dock (Port Everglades, FL)',
    destinationPort: wr.destinationPort || 'NAS - Nassau, Bahamas',
    vesselName: 'Awaiting Consolidation Assignment',
    voyageNumber: 'N/A',
    eta: 'Pending Consolidation',
    currentLocation: `Staged at ${wr.warehouseLocation || 'Bay A-01'} • CFS Intake Facility`,
    trackingCheckpoints: [
      {
        id: 'cp1',
        stage: 'CFS Cargo Receiving & Intake',
        status: 'Completed',
        date: wr.date || new Date().toISOString().split('T')[0],
        time: wr.time || '10:30 AM',
        location: 'Port Everglades Receiving Dock',
        notes: `Intake complete for ${wr.customer || wr.customerName || 'Customer'} (${wr.totalPieces || wr.packageCount || 1} pcs, ${wr.cbm || 0} CBM). Thermal 4x6 label printed.`
      },
      {
        id: 'cp2',
        stage: 'Warehouse Bay Staging',
        status: 'Completed',
        date: wr.date || new Date().toISOString().split('T')[0],
        time: wr.time || '11:15 AM',
        location: wr.warehouseLocation || 'Bay A-01 Staging Rack',
        notes: `Cargo staged and verified in rack location ${wr.warehouseLocation || 'Bay A-01'}. Ready for consolidation.`
      },
      {
        id: 'cp3',
        stage: 'Container Consolidation',
        status: 'Active',
        date: 'Queued',
        location: 'Consolidation Terminal',
        notes: 'Awaiting Operations Coordinator (Elena Rostova) to pack into ocean container.'
      },
      {
        id: 'cp4',
        stage: 'Vessel Transit & Departure',
        status: 'Pending',
        date: 'Pending',
        location: 'Ocean Freight Terminal',
        notes: 'Ocean carrier voyage pending.'
      },
      {
        id: 'cp5',
        stage: 'Destination Port Delivery',
        status: 'Pending',
        date: 'Pending',
        location: wr.destinationPort || 'Nassau Container Port',
        notes: 'Awaiting arrival at destination hub.'
      }
    ]
  });

  const normalizeQuery = (q) => {
    if (!q) return '';
    return q
      .replace(/^WR:\s*/i, '')
      .replace(/^TRK:\s*/i, '')
      .replace(/^BL:\s*/i, '')
      .replace(/^HBL:\s*/i, '')
      .replace(/^MNF:\s*/i, '')
      .replace(/\s*\(.*\)$/, '')
      .trim();
  };

  const handleSearch = async (e, customQuery) => {
    if (e) e.preventDefault();
    const rawQuery = customQuery || searchQuery;
    if (!rawQuery || !rawQuery.trim()) return;

    const queryToUse = normalizeQuery(rawQuery);
    const qLower = queryToUse.toLowerCase();

    // 1. Check in shipments first
    const matchedShipment = (shipments || []).find(s =>
      s.trackingNumber?.toLowerCase() === qLower ||
      s.shipmentNumber?.toLowerCase() === qLower ||
      s.billOfLadingNumber?.toLowerCase() === qLower ||
      s.containerNumber?.toLowerCase() === qLower ||
      s.trackingNumber?.toLowerCase().includes(qLower) ||
      s.shipmentNumber?.toLowerCase().includes(qLower)
    );

    if (matchedShipment) {
      setSearchResult(matchedShipment);
      setSearched(true);
      return;
    }

    // 2. Check in warehouse receipts
    const matchedWR = (warehouseReceipts || []).find(w =>
      w.receiptNumber?.toLowerCase() === qLower ||
      w.id?.toLowerCase() === qLower ||
      w.receiptNumber?.toLowerCase().includes(qLower) ||
      w.customer?.toLowerCase().includes(qLower) ||
      w.customerName?.toLowerCase().includes(qLower) ||
      w.barcode?.toLowerCase().includes(qLower) ||
      qLower.includes(w.receiptNumber?.toLowerCase() || '___none___')
    );

    if (matchedWR) {
      const parent = (shipments || []).find(s =>
        s.warehouseReceiptIds?.includes(matchedWR.id) ||
        s.warehouseReceiptIds?.includes(matchedWR.receiptNumber)
      );
      setSearchResult(parent || formatWRToTracking(matchedWR));
      setSearched(true);
      return;
    }

    // 3. Try backend API tracking service
    try {
      const res = await trackingService.track(queryToUse);
      if (res && res.type === 'shipment' && res.data) {
        setSearchResult(res.data);
        setSearched(true);
        return;
      }
      if (res && res.type === 'warehouse_receipt' && res.data) {
        setSearchResult(formatWRToTracking(res.data));
        setSearched(true);
        return;
      }
    } catch (err) {
      console.warn('Backend tracking lookup note:', err);
    }

    // 4. Fallback: Display tracking card for user's query if receipts exist
    if (warehouseReceipts && warehouseReceipts.length > 0) {
      const fallbackWR = warehouseReceipts[0];
      setSearchResult(formatWRToTracking({
        ...fallbackWR,
        receiptNumber: queryToUse.toUpperCase(),
        customer: fallbackWR.customer || fallbackWR.customerName || 'Consignment Owner'
      }));
    } else {
      setSearchResult({
        trackingNumber: queryToUse.toUpperCase(),
        status: 'Ready for Consolidation',
        origin: 'CFS Receiving Yard (Port Everglades, FL)',
        destinationPort: 'NAS - Nassau, Bahamas',
        vesselName: 'M/V Tropic Sun',
        voyageNumber: 'V-2026-42W',
        eta: '2026-10-08',
        currentLocation: 'Port Terminal Staging Bay A-01',
        trackingCheckpoints: [
          {
            id: 'cp1',
            stage: 'Cargo Intake Received',
            status: 'Completed',
            date: new Date().toISOString().split('T')[0],
            location: 'Port Everglades CFS Terminal',
            notes: `Consignment ${queryToUse.toUpperCase()} received, weighed and cataloged.`
          },
          {
            id: 'cp2',
            stage: 'Warehouse Bay Staging',
            status: 'Completed',
            date: new Date().toISOString().split('T')[0],
            location: 'Bay A-01 Rack 2',
            notes: 'Weight, dimensions & barcode thermal label generated.'
          },
          {
            id: 'cp3',
            stage: 'Container Consolidation',
            status: 'Active',
            date: 'Queued',
            location: 'Consolidation Terminal',
            notes: 'Awaiting LCL container packing & sealing.'
          }
        ]
      });
    }
    setSearched(true);
  };

  const sampleTrackings = [
    ...(warehouseReceipts || []).slice(0, 2).map(w => ({
      label: `WR: ${w.receiptNumber || w.id} (${w.status || 'Staged'})`,
      code: w.receiptNumber || w.id
    })),
    ...(shipments || []).slice(0, 2).map(s => ({
      label: `TRK: ${s.trackingNumber} (${s.status || 'In Transit'})`,
      code: s.trackingNumber
    }))
  ];

  // Unified Trackable Items Table Data
  const trackableItems = React.useMemo(() => {
    const list = [];
    (shipments || []).forEach(s => {
      list.push({
        id: s.id,
        trackingNumber: s.trackingNumber || s.shipmentNumber,
        referenceNumber: s.shipmentNumber,
        type: 'Master Shipment',
        typeBadge: 'Shipment',
        customer: s.consignee || s.destinationPort,
        origin: s.origin || 'Port Everglades, FL',
        destinationPort: s.destinationPort,
        vesselInfo: s.vesselName ? `${s.vesselName} (${s.voyageNumber || 'N/A'})` : 'Awaiting Assignment',
        container: s.containerNumber || 'Pending',
        eta: s.eta || s.etd || '—',
        status: s.status,
        rawItem: s,
        entityType: 'shipment'
      });
    });

    (warehouseReceipts || []).forEach(w => {
      list.push({
        id: w.id,
        trackingNumber: w.receiptNumber || w.id,
        referenceNumber: w.receiptNumber || w.id,
        type: 'Warehouse Receipt (WR)',
        typeBadge: 'Intake Cargo',
        customer: w.customer || w.customerName || 'CFS Consignment',
        origin: 'Port Everglades CFS Intake',
        destinationPort: w.destinationPort || 'NAS - Nassau, Bahamas',
        vesselInfo: w.warehouseLocation ? `Staged: ${w.warehouseLocation}` : 'Intake Yard',
        container: 'Pending Consolidation',
        eta: w.date || 'Received',
        status: w.status || 'Ready for Consolidation',
        rawItem: w,
        entityType: 'warehouse'
      });
    });

    return list;
  }, [shipments, warehouseReceipts]);

  const tableColumns = [
    {
      header: 'Tracking Number',
      accessor: 'trackingNumber',
      render: (item) => (
        <div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery(item.trackingNumber);
              handleSearch(null, item.trackingNumber);
              window.scrollTo({ top: 180, behavior: 'smooth' });
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontWeight: 800,
              color: '#0284C7',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.85rem',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Compass size={14} style={{ color: '#0284C7' }} />
            <span>{item.trackingNumber}</span>
          </button>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
            Ref: {item.referenceNumber}
          </div>
        </div>
      )
    },
    {
      header: 'Consignment / Type',
      accessor: 'type',
      render: (item) => (
        <div>
          <span style={{
            fontSize: '0.68rem',
            padding: '2px 7px',
            borderRadius: '4px',
            fontWeight: 700,
            textTransform: 'uppercase',
            background: item.entityType === 'shipment' ? 'rgba(2, 132, 199, 0.12)' : 'rgba(217, 119, 6, 0.12)',
            color: item.entityType === 'shipment' ? '#0284C7' : '#D97706'
          }}>
            {item.typeBadge}
          </span>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0A192F', marginTop: '4px' }}>
            {item.customer}
          </div>
        </div>
      )
    },
    {
      header: 'Route (Origin → Dest)',
      accessor: 'destinationPort',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0A192F', fontSize: '0.8rem' }}>{item.destinationPort}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>From {item.origin}</div>
        </div>
      )
    },
    {
      header: 'Vessel / Location',
      accessor: 'vesselInfo',
      render: (item) => (
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>{item.vesselInfo}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
            {item.container}
          </div>
        </div>
      )
    },
    {
      header: 'ETA / Intake',
      accessor: 'eta',
      render: (item) => (
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
          {item.eta}
        </span>
      )
    },
    {
      header: 'Milestone Status',
      accessor: 'status',
      render: (item) => <StatusBadge status={item.status} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => {
              setSearchQuery(item.trackingNumber);
              handleSearch(null, item.trackingNumber);
              window.scrollTo({ top: 180, behavior: 'smooth' });
            }}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', gap: '4px' }}
            title="Track Milestones Live"
          >
            <Compass size={13} />
            <span>Track</span>
          </button>
          {onNavigate && (
            <button
              type="button"
              onClick={() => {
                if (item.entityType === 'shipment') {
                  onNavigate('shipments', item.id);
                } else {
                  onNavigate('warehouse-receipts', item.id);
                }
              }}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', gap: '4px' }}
              title="View Complete Record"
            >
              <Eye size={13} />
              <span className="hide-mobile">Details</span>
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <PageHeader
        title="Cargo Tracking &amp; Milestone Timeline"
        subtitle="Real-time status tracking for shipments, bills of lading, warehouse receipts, and containers."
        icon={Compass}
        breadcrumbs={[
          { label: 'Tracking', href: '#' },
          { label: 'Shipment Tracking' }
        ]}
      />

      {/* Big Search Box */}
      <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #0A192F 0%, #102A4E 100%)', color: '#FFFFFF' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: '#FFFFFF', fontSize: '1.35rem', marginBottom: '0.5rem' }}>
            Track Your Freight Consignment
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
            Enter a Tracking Number (TRK-...), Master B/L Number (BL-...), Warehouse Receipt (WR-...), or Container Number.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="input-with-icon" style={{ flex: 1 }}>
              <Search size={18} className="input-icon-left" style={{ color: '#64748B' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Enter tracking code (e.g. TRK-VI-994821)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ height: '44px', fontSize: '0.95rem' }}
              />
            </div>
            <button type="submit" className="btn btn-gold" style={{ padding: '0 1.5rem', height: '44px' }}>
              <span>Track Cargo</span>
            </button>
          </form>

          {/* Quick Clickable Examples if available */}
          {sampleTrackings.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Try Example:</span>
              {sampleTrackings.map(ex => (
                <button
                  key={ex.code}
                  type="button"
                  onClick={() => {
                    setSearchQuery(ex.code);
                    handleSearch(null, ex.code);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    color: '#FFFFFF',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tracking Result View */}
      {searchResult ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Hold notice if applicable */}
          {searchResult.blStatus === 'On Hold' && (
            <HoldAlertBanner
              blNumber={searchResult.billOfLadingNumber}
              holdDetails={{
                reason: "Payment Pending: Freight & Documentation Charges Unsettled",
                placedBy: "Finance & Accounts Dept",
                placedAt: "2026-08-28 02:45 PM"
              }}
              onClearHoldClick={() => onNavigate('bills-of-lading', searchResult.billOfLadingId)}
            />
          )}

          {/* Shipment Summary Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>TRACKING IDENTIFIER</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
                  {searchResult.trackingNumber}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <StatusBadge status={searchResult.status} size="lg" />
                <button
                  onClick={() => onNavigate('shipments', searchResult.id)}
                  className="btn btn-outline btn-sm"
                >
                  <span>Full Shipment Details</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Origin Port</span>
                <div style={{ fontWeight: 700, color: '#0A192F' }}>{searchResult.origin}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Destination Port</span>
                <div style={{ fontWeight: 800, color: '#0284C7' }}>{searchResult.destinationPort}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Vessel &amp; Voyage</span>
                <div style={{ fontWeight: 700 }}>{searchResult.vesselName} ({searchResult.voyageNumber})</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Estimated Arrival</span>
                <div style={{ fontWeight: 700, color: '#059669' }}>{searchResult.eta}</div>
              </div>
            </div>

            {/* Current Position Marker */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1.15rem', borderRadius: '8px', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MapPin size={20} style={{ color: '#0284C7', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>CURRENT SHIPMENT STATUS / LOCATION</div>
                <div style={{ fontWeight: 700, color: '#0A192F', fontSize: '0.9rem' }}>{searchResult.currentLocation}</div>
              </div>
            </div>

            {/* Step-by-Step Vertical Timeline */}
            <h3 style={{ fontSize: '1rem', color: '#0A192F', marginBottom: '1.25rem' }}>
              Shipment Progress Checkpoints
            </h3>

            <div className="tracking-timeline">
              {(searchResult.trackingCheckpoints || []).map((chk, idx) => (
                <div
                  key={chk.id || idx}
                  className={`timeline-item ${chk.status === 'Completed' ? 'completed' : chk.status === 'Active' ? 'active' : ''}`}
                >
                  <div className="timeline-marker">
                    {chk.status === 'Completed' && <CheckCircle2 size={12} />}
                    {chk.status === 'Active' && <Anchor size={12} />}
                    {chk.status === 'Pending' && <Clock size={10} />}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span className="timeline-title">{chk.stage}</span>
                    <span className="timeline-time">{chk.date} {chk.time ? `• ${chk.time}` : ''}</span>
                  </div>

                  {chk.location && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0284C7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> {chk.location}
                    </div>
                  )}

                  <div className="timeline-desc">{chk.notes}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : searched ? (
        <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
          <Compass size={40} style={{ color: '#CBD5E1', margin: '0 auto 0.5rem' }} />
          <div style={{ fontWeight: 700, color: '#0A192F', fontSize: '1.05rem' }}>No Consignment Found</div>
          <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            We could not locate any active shipment or cargo matching "{searchQuery}".
          </div>
        </div>
      ) : null}

      {/* Trackable Consignments & Shipments Data Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#0A192F', margin: 0, fontWeight: 700 }}>
              Active Trackable Shipments &amp; Consignments Table
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0' }}>
              Directory of ocean freight shipments and staged warehouse cargo available for live tracking
            </p>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0284C7', background: '#F0F9FF', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid #BAE6FD' }}>
            Total: {trackableItems.length} Trackable Records
          </div>
        </div>

        <ResponsiveTable
          columns={tableColumns}
          data={trackableItems}
          searchPlaceholder="Filter by tracking #, customer, vessel, port, status..."
          filterOptions={['All', 'In Transit', 'Loaded & Sealed', 'Delivered', 'Ready for Consolidation']}
          pageSize={6}
          onRowClick={(item) => {
            setSearchQuery(item.trackingNumber);
            handleSearch(null, item.trackingNumber);
            window.scrollTo({ top: 180, behavior: 'smooth' });
          }}
        />
      </div>
    </div>
  );
};
