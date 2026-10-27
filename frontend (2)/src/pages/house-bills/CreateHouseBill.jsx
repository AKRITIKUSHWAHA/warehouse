import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  FileText,
  Package,
  Check,
  ArrowLeft,
  DollarSign,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MapPin,
  UserCheck
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';

export const CreateHouseBill = ({ onNavigate }) => {
  const { customers = [], warehouseReceipts = [], houseBills = [], createHouseBill, settings } = useAppData();
  const { showToast } = useToast();

  const [selectedWrIds, setSelectedWrIds] = useState([]);
  const [wrSearch, setWrSearch] = useState('');
  const [showAdditionalFees, setShowAdditionalFees] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate initial HBL number
  const configuredHblPrefix = settings?.numberingRules?.houseBillPrefix?.trim() || 'HBL-2026-';
  const prefix = configuredHblPrefix.endsWith('-') ? configuredHblPrefix : `${configuredHblPrefix}-`;
  const maxHblSeq = houseBills.reduce((max, h) => {
    const raw = String(h.hblNumber || '');
    const match = raw.match(/(\d+)$/);
    const num = match ? parseInt(match[1], 10) : NaN;
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  const nextSeq = Math.max(houseBills.length + 1, maxHblSeq + 1);
  const initialHblNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

  // Form State - only what's necessary
  const [formData, setFormData] = useState({
    hblNumber: initialHblNumber,
    consolidationNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    freightTerms: 'Freight Prepaid',
    // Freight Rates
    rateBasis: 'cft',
    oceanFreightRate: 3.50,
    docFee: 50.00,
    terminalHandlingFee: 35.00,
    customsAdminFee: 25.00
  });

  // Active unassigned staged receipts in warehouse
  const unassignedWrs = useMemo(() => {
    return warehouseReceipts.filter(wr => {
      const notAssigned = !wr.assignedHouseBillId || wr.assignedHouseBillId === '';
      const notConsolidated = wr.status !== 'Consolidated' && wr.status !== 'Cancelled' && wr.status !== 'Delivered';
      return notAssigned && notConsolidated;
    });
  }, [warehouseReceipts]);

  // Filtered displayed receipts based on search
  const displayedWrs = useMemo(() => {
    if (!wrSearch.trim()) return unassignedWrs;
    const q = wrSearch.toLowerCase();
    return unassignedWrs.filter(w =>
      (w.receiptNumber && w.receiptNumber.toLowerCase().includes(q)) ||
      (w.customer && w.customer.toLowerCase().includes(q)) ||
      (w.customerName && w.customerName.toLowerCase().includes(q)) ||
      (w.consignee && w.consignee.toLowerCase().includes(q)) ||
      (w.shipper && w.shipper.toLowerCase().includes(q)) ||
      (w.destinationPort && w.destinationPort.toLowerCase().includes(q)) ||
      (w.cargoDescription && w.cargoDescription.toLowerCase().includes(q))
    );
  }, [unassignedWrs, wrSearch]);

  // Selected WR items
  const selectedWrs = useMemo(() => {
    return warehouseReceipts.filter(wr => selectedWrIds.includes(wr.id) || selectedWrIds.includes(wr.receiptNumber));
  }, [warehouseReceipts, selectedWrIds]);

  // Auto-derived Customer & Destination from selected WRs
  const derivedDetails = useMemo(() => {
    if (selectedWrs.length === 0) {
      return {
        customerName: 'None selected yet',
        destinationPort: 'Will auto-populate from selected receipt',
        destinationCode: 'STT',
        shipper: 'CFS Terminal Miami, FL'
      };
    }
    const first = selectedWrs[0];
    const custName = first.customer || first.customerName || (first.shipper ? first.shipper.split('\n')[0] : '') || (first.consignee || '').split('\n')[0] || 'Valued Customer';
    const destPort = first.destinationPort || first.dischargePort || 'Port of Charlotte Amalie';
    const destCode = first.destinationCode || 'STT';
    const shipperName = first.shipper ? first.shipper.split('\n')[0] : 'CFS Miami Terminal';

    return {
      customerName: custName,
      destinationPort: destPort,
      destinationCode: destCode,
      shipper: shipperName
    };
  }, [selectedWrs]);

  // Combined totals from selected WRs
  const combinedTotals = useMemo(() => {
    let totalPieces = 0;
    let totalPackages = 0;
    let totalWeightLbs = 0;
    let totalCft = 0;
    let totalCbm = 0;
    let combinedPackages = [];

    selectedWrs.forEach(wr => {
      if (wr.packages && wr.packages.length > 0) {
        combinedPackages = [...combinedPackages, ...wr.packages];
      }
      totalPieces += Number(wr.totalPieces || wr.total_pieces || wr.packageCount || 0);
      totalPackages += Number(wr.packages?.length || wr.packageCount || 1);
      totalWeightLbs += Number(wr.weightLbs || wr.weight_lbs || 0);
      totalCft += Number(wr.totalCft || wr.total_cft || wr.cft || 0);
      totalCbm += Number(wr.totalCbm || wr.total_cbm || wr.cbm || 0);
    });

    const totalWeightKg = Number((totalWeightLbs * 0.453592).toFixed(1));
    totalCft = Number(totalCft.toFixed(2));
    totalCbm = Number(totalCbm.toFixed(2));

    const cargoDescriptions = selectedWrs.map(w => w.cargoDescription).filter(Boolean).join('; ');

    return {
      packages: combinedPackages,
      totalPieces,
      totalPackages,
      totalWeightLbs,
      totalWeightKg,
      totalCft,
      totalCbm,
      cargoDescriptions
    };
  }, [selectedWrs]);

  // Calculated Freight Charges
  const rateBreakdown = useMemo(() => {
    const rate = Number(formData.oceanFreightRate) || 0;
    let oceanCharge = 0;

    if (formData.rateBasis === 'cft') {
      oceanCharge = combinedTotals.totalCft * rate;
    } else if (formData.rateBasis === 'cbm') {
      oceanCharge = combinedTotals.totalCbm * rate;
    } else if (formData.rateBasis === 'weight') {
      oceanCharge = (combinedTotals.totalWeightLbs / 100) * rate;
    } else {
      oceanCharge = rate;
    }

    oceanCharge = Number(oceanCharge.toFixed(2));
    const docFee = Number(formData.docFee) || 0;
    const terminalFee = Number(formData.terminalHandlingFee) || 0;
    const customsFee = Number(formData.customsAdminFee) || 0;

    const totalCharges = Number((oceanCharge + docFee + terminalFee + customsFee).toFixed(2));

    return {
      oceanCharge,
      docFee,
      terminalFee,
      customsFee,
      totalCharges
    };
  }, [formData, combinedTotals]);

  // Existing Consolidation numbers for datalist suggestions
  const existingConsolidationNumbers = useMemo(() => {
    const list = new Set();
    houseBills.forEach(h => {
      if (h.assignedConsolidationId) list.add(h.assignedConsolidationId.trim());
    });
    return Array.from(list);
  }, [houseBills]);

  // Toggle selection of a WR
  const toggleWr = (wr) => {
    const key = typeof wr === 'object' ? (wr.id || wr.receiptNumber) : wr;
    const wrObj = typeof wr === 'object' ? wr : warehouseReceipts.find(w => w.id === wr || w.receiptNumber === wr);
    const wrId = wrObj?.id;
    const wrNum = wrObj?.receiptNumber;

    setSelectedWrIds(prev => {
      const isAlreadySelected = prev.some(id => id === key || (wrId && id === wrId) || (wrNum && id === wrNum));
      if (isAlreadySelected) {
        return prev.filter(id => id !== key && id !== wrId && id !== wrNum);
      } else {
        return [...prev, key];
      }
    });
  };

  const handleSelectAllWrs = () => {
    const allSelected = displayedWrs.length > 0 && displayedWrs.every(w => selectedWrIds.some(id => id === w.id || id === w.receiptNumber));
    if (allSelected) {
      setSelectedWrIds([]);
    } else {
      setSelectedWrIds(displayedWrs.map(w => w.id || w.receiptNumber));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedWrIds.length === 0) {
      showToast('Please select at least 1 Warehouse Receipt to link to this House Bill.', 'warning', 'No Receipts Selected');
      return;
    }

    setIsSubmitting(true);
    try {
      const firstWr = selectedWrs[0];
      const customerName = derivedDetails.customerName;

      const matchedCustomer = customers.find(c => {
        const cName = (c.name || c.companyName || '').toLowerCase().trim();
        return cName && customerName.toLowerCase().includes(cName);
      });

      const payload = {
        hblNumber: formData.hblNumber,
        customerId: firstWr?.customerId || matchedCustomer?.id || null,
        customerName: customerName,
        shipper: {
          name: derivedDetails.shipper,
          address: firstWr?.shipper || "CFS Cargo Terminal, Miami FL"
        },
        consignee: {
          name: customerName,
          address: firstWr?.consignee || matchedCustomer?.address || derivedDetails.destinationPort
        },
        notifyParty: {
          name: firstWr?.agentName || matchedCustomer?.agentName || "Direct Consignee Delivery",
          address: derivedDetails.destinationPort
        },
        agentId: firstWr?.agentId || null,
        agentName: firstWr?.agentName || matchedCustomer?.agentName || "",
        originPort: "Port of Miami (USMIA), FL",
        destinationPort: derivedDetails.destinationPort,
        destinationCode: derivedDetails.destinationCode,
        warehouseReceiptIds: selectedWrs.length > 0 ? selectedWrs.map(w => w.receiptNumber || w.id) : selectedWrIds,
        cargoDescription: combinedTotals.cargoDescriptions || "Commercial Cargo Goods",
        packages: combinedTotals.packages,
        totalPackages: combinedTotals.totalPackages,
        totalPieces: combinedTotals.totalPieces,
        totalWeightLbs: combinedTotals.totalWeightLbs,
        totalWeightKg: combinedTotals.totalWeightKg,
        totalCft: combinedTotals.totalCft,
        totalCbm: combinedTotals.totalCbm,
        freightTerms: formData.freightTerms || "Freight Prepaid",
        freightCharges: {
          rateBasis: formData.rateBasis,
          rate: Number(formData.oceanFreightRate),
          oceanFreightAmount: rateBreakdown.oceanCharge,
          documentationFee: rateBreakdown.docFee,
          terminalHandlingFee: rateBreakdown.terminalFee,
          customsFee: rateBreakdown.customsFee,
          totalAmount: rateBreakdown.totalCharges,
          currency: 'USD'
        },
        issueDate: formData.issueDate,
        assignedConsolidationId: formData.consolidationNumber?.trim() || null,
        status: "Active",
        notes: `Created linking ${selectedWrIds.length} Warehouse Receipt(s).`
      };

      await createHouseBill(payload);
      showToast(`House Bill ${formData.hblNumber} created successfully!`, 'success', 'House B/L Issued');
      try { localStorage.removeItem('vicustoms_selected_hbl_customer'); } catch (e) {}
      onNavigate('house-bills');
    } catch (err) {
      showToast(err.message || 'Failed to issue House Bill', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1180px', margin: '0 auto' }}>
      <PageHeader
        title="Create House Bill of Lading (HBL)"
        subtitle="Consolidate staged warehouse receipts into an official House Bill under your company consolidation number."
        icon={FileText}
        breadcrumbs={[
          { label: 'House Bills of Lading', href: '#', onClick: () => onNavigate('house-bills') },
          { label: 'Create New' }
        ]}
        actions={
          <button
            type="button"
            onClick={() => onNavigate('house-bills')}
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <ArrowLeft size={15} />
            <span>Back to House Bills</span>
          </button>
        }
      />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* CARD 1: House B/L & Consolidation Details (Clean & Minimal) */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.65rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0A192F', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={17} style={{ color: '#0284C7' }} />
              <span>House Bill &amp; Consolidation Details</span>
            </h3>
            {selectedWrIds.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: '#0284C7', background: '#F0F9FF', padding: '3px 10px', borderRadius: '6px', border: '1px solid #BAE6FD' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                  <UserCheck size={14} />
                  {derivedDetails.customerName}
                </span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} />
                  {derivedDetails.destinationPort}
                </span>
              </div>
            )}
          </div>

          {/* Clean 3-Column Header: HBL #, Issue Date, Company Consolidation # */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                House B/L Number <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                style={{ fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}
                value={formData.hblNumber}
                onChange={(e) => setFormData({ ...formData, hblNumber: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Issue Date <span className="required">*</span>
              </label>
              <input
                type="date"
                className="form-control"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                required
              />
            </div>

            {/* Company Consolidation Number */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={14} style={{ color: '#2563EB' }} />
                <span>Company Consolidation Number</span>
              </label>
              <input
                type="text"
                className="form-control"
                list="existing-consol-options"
                placeholder="e.g. CNS-2026-001"
                style={{ fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', background: '#F8FAFC', borderColor: '#93C5FD' }}
                value={formData.consolidationNumber}
                onChange={(e) => setFormData({ ...formData, consolidationNumber: e.target.value.toUpperCase() })}
              />
              <datalist id="existing-consol-options">
                {existingConsolidationNumbers.map(num => (
                  <option key={num} value={num} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* CARD 2: SELECT WAREHOUSE RECEIPTS TO LINK */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.65rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0A192F', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={17} style={{ color: '#0284C7' }} />
                <span>Select Warehouse Receipts to Link</span>
                <span style={{ fontSize: '0.72rem', background: selectedWrIds.length > 0 ? '#DCFCE7' : '#F1F5F9', color: selectedWrIds.length > 0 ? '#15803D' : '#64748B', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                  {selectedWrIds.length} Selected
                </span>
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Check the warehouse receipts below to attach to this House Bill. Consignee &amp; Port details auto-populate automatically.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.25rem 0.5rem' }}>
                <Search size={14} style={{ color: '#64748B' }} />
                <input
                  type="text"
                  placeholder="Filter by customer, WR #, port..."
                  value={wrSearch}
                  onChange={(e) => setWrSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.75rem', width: '180px' }}
                />
              </div>

              <button
                type="button"
                onClick={handleSelectAllWrs}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
              >
                {selectedWrIds.length === displayedWrs.length && displayedWrs.length > 0 ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Receipts Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ width: '40px', padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={displayedWrs.length > 0 && displayedWrs.every(w => selectedWrIds.some(id => id === w.id || id === w.receiptNumber))}
                      onChange={handleSelectAllWrs}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>WR Number</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Customer</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Receiver</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>Pieces &amp; Weight</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Volume (CFT / CBM)</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Destination Port</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Cargo Contents</th>
                </tr>
              </thead>
              <tbody>
                {displayedWrs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: '#64748B' }}>
                      <Package size={28} style={{ color: '#94A3B8', margin: '0 auto 8px auto', display: 'block' }} />
                      <div style={{ fontWeight: 700, color: '#334155' }}>
                        No unassigned staged warehouse receipts found.
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                        Please create a Warehouse Receipt first in Step 1.
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedWrs.map(wr => {
                    const wrKey = wr.id || wr.receiptNumber;
                    const isSelected = selectedWrIds.some(id => id === wrKey || (wr.id && id === wr.id) || (wr.receiptNumber && id === wr.receiptNumber));

                    return (
                      <tr
                        key={wrKey}
                        onClick={() => toggleWr(wr)}
                        style={{
                          background: isSelected ? '#EFF6FF' : 'transparent',
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background 0.15s ease',
                          cursor: 'pointer'
                        }}
                      >
                        <td 
                          style={{ textAlign: 'center', padding: '0.6rem 0.75rem', cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWr(wr);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleWr(wr)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#0A192F' }}>
                          {wr.receiptNumber || wr.id}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#0A192F' }}>
                          {wr.customer || wr.customerName || (wr.shipper ? wr.shipper.split('\n')[0] : '—')}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#0A192F', fontWeight: 600 }}>
                          {wr.consigneeName || (wr.consignee ? wr.consignee.split('\n')[0] : '—')}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700 }}>{wr.totalPieces || wr.packageCount || 1} pcs</span>
                          <span style={{ color: '#64748B', fontSize: '0.72rem', marginLeft: '4px' }}>({wr.weightLbs || 0} lbs)</span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, color: '#D97706' }}>{wr.totalCft || wr.cft || 0} CFT</span>
                          <span style={{ color: '#0284C7', fontSize: '0.72rem', marginLeft: '4px' }}>({wr.totalCbm || 0} CBM)</span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#0284C7', fontWeight: 600, fontSize: '0.75rem' }}>
                          {wr.destinationPort || wr.dischargePort || 'STT'}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#475569', fontSize: '0.75rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {wr.cargoDescription || 'Commercial Cargo'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Combined Totals Bar */}
          <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', display: 'block' }}>Total Pieces</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0A192F' }}>{combinedTotals.totalPieces} pcs</span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', display: 'block' }}>Total Weight</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0A192F' }}>{combinedTotals.totalWeightLbs.toLocaleString()} lbs ({combinedTotals.totalWeightKg} kg)</span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', display: 'block' }}>Total Volume</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#D97706' }}>{combinedTotals.totalCft} CFT <span style={{ color: '#0284C7', fontWeight: 600 }}>({combinedTotals.totalCbm} CBM)</span></span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', display: 'block' }}>Calculated Freight Total</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#16A34A', fontFamily: 'JetBrains Mono, monospace' }}>
                ${rateBreakdown.totalCharges.toFixed(2)} USD
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: Compact Freight Charges & Rating */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0A192F', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={17} style={{ color: '#16A34A' }} />
              <span>Freight Rating &amp; Charges</span>
            </h3>

            <button
              type="button"
              onClick={() => setShowAdditionalFees(!showAdditionalFees)}
              style={{ background: 'transparent', border: 'none', color: '#0284C7', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              <span>{showAdditionalFees ? 'Hide Additional Surcharges' : 'View / Edit Surcharges (Doc, Terminal, Customs)'}</span>
              {showAdditionalFees ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Primary Row: Rate Basis, Ocean Rate, Ocean Subtotal, Total */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Rate Basis
              </label>
              <select
                className="form-select form-select-sm"
                value={formData.rateBasis}
                onChange={(e) => setFormData({ ...formData, rateBasis: e.target.value })}
              >
                <option value="cft">Per CFT ($/CFT)</option>
                <option value="cbm">Per CBM ($/CBM)</option>
                <option value="weight">Per 100 LBS</option>
                <option value="flat">Flat Ocean Rate</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Ocean Freight Rate ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control form-control-sm"
                value={formData.oceanFreightRate}
                onChange={(e) => setFormData({ ...formData, oceanFreightRate: e.target.value })}
              />
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Ocean Freight Amount</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0A192F', fontFamily: 'JetBrains Mono, monospace' }}>
                ${rateBreakdown.oceanCharge.toFixed(2)}
              </span>
            </div>

            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#047857', display: 'block' }}>Total Freight Charges</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#059669', fontFamily: 'JetBrains Mono, monospace' }}>
                ${rateBreakdown.totalCharges.toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* Collapsible Surcharges Section */}
          {showAdditionalFees && (
            <div style={{ marginTop: '0.5rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.65rem' }}>
                Standard Surcharges &amp; Administrative Fees:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '3px' }}>Documentation Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control form-control-sm"
                    value={formData.docFee}
                    onChange={(e) => setFormData({ ...formData, docFee: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '3px' }}>Terminal Handling ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control form-control-sm"
                    value={formData.terminalHandlingFee}
                    onChange={(e) => setFormData({ ...formData, terminalHandlingFee: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '3px' }}>Customs Admin Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control form-control-sm"
                    value={formData.customsAdminFee}
                    onChange={(e) => setFormData({ ...formData, customsAdminFee: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SUBMIT BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0' }}>
          <button
            type="button"
            onClick={() => onNavigate('house-bills')}
            className="btn btn-outline"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || selectedWrIds.length === 0}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.65rem 1.5rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              opacity: selectedWrIds.length === 0 ? 0.6 : 1
            }}
          >
            <Check size={18} />
            <span>
              {isSubmitting
                ? 'Issuing House Bill...'
                : `Issue House Bill (${selectedWrIds.length} Linked WRs)`}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
