import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  FileText,
  Building2,
  Package,
  Check,
  ArrowLeft,
  DollarSign,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Info
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';

export const CreateHouseBill = ({ onNavigate }) => {
  const { customers = [], warehouseReceipts = [], houseBills = [], createHouseBill, settings } = useAppData();
  const { showToast } = useToast();

  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('vicustoms_selected_hbl_customer') : null;
    if (saved && customers.some(c => c.id === saved)) {
      return saved;
    }
    return customers[0]?.id || '';
  });

  const [selectedWrIds, setSelectedWrIds] = useState([]);
  const [wrSearch, setWrSearch] = useState('');
  const [showAllAvailableWrs, setShowAllAvailableWrs] = useState(false);
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

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0] || null;

  // Form State
  const [formData, setFormData] = useState({
    hblNumber: initialHblNumber,
    consolidationNumber: '',
    freightTerms: 'Freight Prepaid',
    issueDate: new Date().toISOString().split('T')[0],
    destinationPort: selectedCustomer?.destinationPort || 'STT - Port of Charlotte Amalie',
    destinationCode: selectedCustomer?.destinationCode || 'STT',
    cargoDescription: 'General Commercial Cargo & Package Goods',
    notes: '',
    // Freight Rates
    rateBasis: 'cft',
    oceanFreightRate: 3.50,
    docFee: 50.00,
    terminalHandlingFee: 35.00,
    customsAdminFee: 25.00
  });

  // When selected customer changes, update destination port
  const handleCustomerChange = (custId) => {
    setSelectedCustomerId(custId);
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      setFormData(prev => ({
        ...prev,
        destinationPort: cust.destinationPort || prev.destinationPort,
        destinationCode: cust.destinationCode || prev.destinationCode
      }));
    }
  };

  // Eligible Warehouse Receipts (unassigned to an HBL and active)
  const eligibleWrs = useMemo(() => {
    return warehouseReceipts.filter(wr => {
      const notAssigned = !wr.assignedHouseBillId || wr.assignedHouseBillId === '';
      const notConsolidated = wr.status !== 'Consolidated' && wr.status !== 'Cancelled' && wr.status !== 'Delivered';
      if (!notAssigned || !notConsolidated) return false;

      const custId = wr.customerId || wr.customer_id;
      const matchCustomer = custId === selectedCustomerId ||
        wr.customer?.trim().toLowerCase() === selectedCustomer?.name?.trim().toLowerCase() ||
        wr.customerName?.trim().toLowerCase() === selectedCustomer?.name?.trim().toLowerCase() ||
        (wr.consignee && selectedCustomer?.name && wr.consignee.toLowerCase().includes(selectedCustomer.name.trim().toLowerCase())) ||
        (selectedCustomer?.name && wr.consignee && selectedCustomer.name.toLowerCase().includes(wr.consignee.split('\n')[0].trim().toLowerCase()));

      return matchCustomer;
    });
  }, [warehouseReceipts, selectedCustomerId, selectedCustomer]);

  // Receipts to display: customer-specific or all unassigned
  const availableWrs = useMemo(() => {
    let list = [];
    if (showAllAvailableWrs || eligibleWrs.length === 0) {
      list = warehouseReceipts.filter(wr => {
        return (!wr.assignedHouseBillId || wr.assignedHouseBillId === '') && wr.status !== 'Consolidated' && wr.status !== 'Cancelled';
      });
    } else {
      list = eligibleWrs;
    }

    if (!wrSearch.trim()) return list;
    const q = wrSearch.toLowerCase();
    return list.filter(w =>
      (w.receiptNumber && w.receiptNumber.toLowerCase().includes(q)) ||
      (w.customer && w.customer.toLowerCase().includes(q)) ||
      (w.consignee && w.consignee.toLowerCase().includes(q)) ||
      (w.shipper && w.shipper.toLowerCase().includes(q)) ||
      (w.cargoDescription && w.cargoDescription.toLowerCase().includes(q))
    );
  }, [showAllAvailableWrs, eligibleWrs, warehouseReceipts, wrSearch]);

  // Selected WR items
  const selectedWrs = useMemo(() => {
    return warehouseReceipts.filter(wr => selectedWrIds.includes(wr.id) || selectedWrIds.includes(wr.receiptNumber));
  }, [warehouseReceipts, selectedWrIds]);

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
  const toggleWr = (wrId) => {
    setSelectedWrIds(prev =>
      prev.includes(wrId) ? prev.filter(id => id !== wrId) : [...prev, wrId]
    );
  };

  const handleSelectAllWrs = () => {
    if (selectedWrIds.length === availableWrs.length) {
      setSelectedWrIds([]);
    } else {
      setSelectedWrIds(availableWrs.map(w => w.id || w.receiptNumber));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedWrIds.length === 0) {
      showToast('Please select at least 1 Warehouse Receipt to link to this House Bill.', 'warning', 'No Receipts Linked');
      return;
    }

    setIsSubmitting(true);
    try {
      const firstWr = selectedWrs[0];
      const customerName = selectedCustomer?.name || selectedCustomer?.companyName || (firstWr?.consignee || '').split('\n')[0] || "Valued Customer";

      const payload = {
        hblNumber: formData.hblNumber,
        customerId: selectedCustomer?.id || firstWr?.customerId || null,
        customerName: customerName,
        shipper: {
          name: firstWr?.shipper ? firstWr.shipper.split('\n')[0] : "Global Retail Suppliers Inc.",
          address: firstWr?.shipper || "CFS Cargo Terminal, Miami FL"
        },
        consignee: {
          name: customerName,
          address: selectedCustomer?.address || firstWr?.consignee || formData.destinationPort || "Destination Port Terminal"
        },
        notifyParty: {
          name: firstWr?.agentName || selectedCustomer?.agentName || "Direct Consignee Delivery",
          address: "Destination Port Cargo Terminal"
        },
        agentId: firstWr?.agentId || null,
        agentName: firstWr?.agentName || selectedCustomer?.agentName || "",
        originPort: "Port of Miami (USMIA), FL",
        destinationPort: formData.destinationPort,
        destinationCode: formData.destinationCode,
        warehouseReceiptIds: selectedWrs.length > 0 ? selectedWrs.map(w => w.receiptNumber || w.id) : selectedWrIds,
        cargoDescription: combinedTotals.cargoDescriptions || formData.cargoDescription || "Commercial Cargo Goods",
        packages: combinedTotals.packages,
        totalPackages: combinedTotals.totalPackages,
        totalPieces: combinedTotals.totalPieces,
        totalWeightLbs: combinedTotals.totalWeightLbs,
        totalWeightKg: combinedTotals.totalWeightKg,
        totalCft: combinedTotals.totalCft,
        totalCbm: combinedTotals.totalCbm,
        freightTerms: formData.freightTerms,
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
        notes: formData.notes || `Created linking ${selectedWrIds.length} Warehouse Receipt(s).`
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title="Create House Bill of Lading (HBL)"
        subtitle="Step 2: Link staged warehouse receipts into an official House Bill with your company Consolidation Number."
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
        {/* CARD 1: Core Identifiers & Company Consolidation Number */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.65rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0A192F', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={17} style={{ color: '#0284C7' }} />
              <span>1. House B/L &amp; Consolidation Details</span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Client Step 2 Flow</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>House B/L Number <span className="required">*</span></label>
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
              <label className="form-label" style={{ fontWeight: 700 }}>Issue Date <span className="required">*</span></label>
              <input
                type="date"
                className="form-control"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                required
              />
            </div>

            {/* HIGH-PRIORITY FIELD: Company Consolidation Number */}
            <div style={{ background: '#EFF6FF', border: '1.5px solid #3B82F6', borderRadius: '6px', padding: '0.6rem 0.75rem' }}>
              <label className="form-label" style={{ fontWeight: 800, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                <Sparkles size={14} style={{ color: '#2563EB' }} />
                <span>Company Consolidation # (Step 2 Link)</span>
              </label>
              <input
                type="text"
                className="form-control"
                list="existing-consol-options"
                placeholder="e.g. CNS-2026-001"
                style={{ fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', background: '#FFFFFF' }}
                value={formData.consolidationNumber}
                onChange={(e) => setFormData({ ...formData, consolidationNumber: e.target.value.toUpperCase() })}
              />
              <datalist id="existing-consol-options">
                {existingConsolidationNumbers.map(num => (
                  <option key={num} value={num} />
                ))}
              </datalist>
              <div style={{ fontSize: '0.68rem', color: '#2563EB', marginTop: '3px', fontWeight: 600 }}>
                Links to Step 3 Master B/L &amp; Manifest
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Customer / Consignee <span className="required">*</span></label>
              <select
                className="form-select"
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                required
              >
                <option value="">-- Select Customer Account --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.companyName} {c.customerNumber ? `(${c.customerNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Destination Port</label>
              <input
                type="text"
                className="form-control"
                value={formData.destinationPort}
                onChange={(e) => setFormData({ ...formData, destinationPort: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Freight Payment Terms</label>
              <select
                className="form-select"
                value={formData.freightTerms}
                onChange={(e) => setFormData({ ...formData, freightTerms: e.target.value })}
              >
                <option value="Freight Prepaid">Freight Prepaid</option>
                <option value="Freight Collect">Freight Collect</option>
                <option value="Third Party Billing">Third Party Billing</option>
              </select>
            </div>
          </div>
        </div>

        {/* CARD 2: LINK WAREHOUSE RECEIPTS (The Main Action) */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.65rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0A192F', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={17} style={{ color: '#16A34A' }} />
                <span>2. Select Warehouse Receipts to Link</span>
                <span style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                  {selectedWrIds.length} Linked
                </span>
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0' }}>
                Check the boxes next to the receipts you want to include in this House Bill.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.25rem 0.5rem' }}>
                <Search size={14} style={{ color: '#64748B' }} />
                <input
                  type="text"
                  placeholder="Filter WRs..."
                  value={wrSearch}
                  onChange={(e) => setWrSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.75rem', width: '130px' }}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAllAvailableWrs(!showAllAvailableWrs)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', color: '#0284C7' }}
              >
                {showAllAvailableWrs ? 'Show Customer Only' : 'Show All Staged WRs'}
              </button>

              <button
                type="button"
                onClick={handleSelectAllWrs}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
              >
                {selectedWrIds.length === availableWrs.length && availableWrs.length > 0 ? 'Deselect All' : 'Select All'}
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
                      checked={availableWrs.length > 0 && selectedWrIds.length === availableWrs.length}
                      onChange={handleSelectAllWrs}
                    />
                  </th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>WR Number</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Customer / Consignee</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Shipper</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>Pieces &amp; Weight</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Volume (CFT / CBM)</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Cargo Contents</th>
                </tr>
              </thead>
              <tbody>
                {availableWrs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                      <div style={{ fontWeight: 600 }}>No unassigned Warehouse Receipts found for this selection.</div>
                      <button
                        type="button"
                        onClick={() => setShowAllAvailableWrs(true)}
                        className="btn btn-link btn-sm"
                        style={{ color: '#0284C7', marginTop: '4px' }}
                      >
                        Click to view all unassigned warehouse receipts
                      </button>
                    </td>
                  </tr>
                ) : (
                  availableWrs.map(wr => {
                    const isSelected = selectedWrIds.includes(wr.id) || selectedWrIds.includes(wr.receiptNumber);
                    return (
                      <tr
                        key={wr.id || wr.receiptNumber}
                        onClick={() => toggleWr(wr.id || wr.receiptNumber)}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          background: isSelected ? '#F0FDF4' : '#FFFFFF',
                          cursor: 'pointer'
                        }}
                      >
                        <td style={{ textAlign: 'center', padding: '0.6rem 0.75rem' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#0A192F' }}>
                          {wr.receiptNumber || wr.id}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>
                          {wr.customer || wr.customerName || (wr.consignee || '').split('\n')[0]}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#64748B', fontSize: '0.75rem' }}>
                          {(wr.shipper || '').split('\n')[0] || 'Supplier'}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700 }}>{wr.totalPieces || wr.packageCount || 1} pcs</span>
                          <span style={{ color: '#64748B', fontSize: '0.72rem', marginLeft: '4px' }}>({wr.weightLbs || 0} lbs)</span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, color: '#D97706' }}>{wr.totalCft || wr.cft || 0} CFT</span>
                          <span style={{ color: '#0284C7', fontSize: '0.72rem', marginLeft: '4px' }}>({wr.totalCbm || 0} CBM)</span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#475569', fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#D97706' }}>{combinedTotals.totalCft} CFT <span style={{ color: '#0284C7' }}>({combinedTotals.totalCbm} CBM)</span></span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', display: 'block' }}>Calculated Freight Total</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#16A34A', fontFamily: 'JetBrains Mono, monospace' }}>
                ${rateBreakdown.totalCharges.toFixed(2)} USD
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: Compact Rating & Charges */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.65rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0A192F', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={17} style={{ color: '#16A34A' }} />
              <span>3. Freight Rating &amp; Charges Breakdown</span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Auto-calculated live</span>
          </div>

          <div className="grid grid-cols-5 gap-3">
            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '3px' }}>Rate Basis</label>
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
              <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '3px' }}>Ocean Rate ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control form-control-sm"
                value={formData.oceanFreightRate}
                onChange={(e) => setFormData({ ...formData, oceanFreightRate: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '3px' }}>Doc Fee ($)</label>
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
              <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '3px' }}>Terminal Fee ($)</label>
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
              <label style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginBottom: '3px' }}>Customs Fee ($)</label>
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

        {/* BOTTOM SUBMIT BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
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
            style={{ padding: '0.65rem 1.75rem', fontSize: '0.95rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Check size={18} />
            <span>{isSubmitting ? 'Issuing House Bill...' : `Issue House Bill (${selectedWrIds.length} Linked WRs)`}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
