import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  FileText,
  Building2,
  Package,
  Check,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Calculator,
  Box,
  Layers,
  Info,
  DollarSign,
  Search,
  X
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const CreateHouseBill = ({ onNavigate }) => {
  const { customers, warehouseReceipts, houseBills, createHouseBill, settings } = useAppData();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || 'CUS-2026-0001');
  const [selectedWrIds, setSelectedWrIds] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.destinationPort?.toLowerCase().includes(q) ||
      c.customerNumber?.toLowerCase().includes(q) ||
      c.destinationCode?.toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

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

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  // Eligible Warehouse Receipts for the selected customer (strictly in stock / unassigned)
  const eligibleWrs = useMemo(() => {
    return warehouseReceipts.filter(wr => {
      const matchCustomer = wr.customerId === selectedCustomerId ||
        wr.customer?.toLowerCase() === selectedCustomer?.name?.toLowerCase() ||
        wr.customerName?.toLowerCase() === selectedCustomer?.name?.toLowerCase() ||
        (wr.consignee && selectedCustomer?.name && wr.consignee.toLowerCase().includes(selectedCustomer.name.toLowerCase()));
      
      const notAssigned = !wr.assignedHouseBillId || wr.assignedHouseBillId === '';
      const notConsolidated = wr.status !== 'Consolidated' && wr.status !== 'Cancelled' && wr.status !== 'Delivered';
      
      return matchCustomer && notAssigned && notConsolidated;
    });
  }, [warehouseReceipts, selectedCustomerId, selectedCustomer]);

  // Selected WR items
  const selectedWrs = useMemo(() => {
    return warehouseReceipts.filter(wr => selectedWrIds.includes(wr.id) || selectedWrIds.includes(wr.receiptNumber));
  }, [warehouseReceipts, selectedWrIds]);

  // Form State for HBL & Freight Rates
  const [formData, setFormData] = useState({
    hblNumber: initialHblNumber,
    freightTerms: 'Freight Prepaid',
    issueDate: new Date().toISOString().split('T')[0],
    notes: '',
    // Freight Rates & Rating Inputs
    rateBasis: 'cft', // 'cft' | 'cbm' | 'weight' | 'flat'
    oceanFreightRate: 3.50, // $3.50 per CFT default
    docFee: 50.00,
    terminalHandlingFee: 35.00,
    customsAdminFee: 0.00
  });

  // Calculate combined totals from selected WRs
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

  // Calculated Freight Charges Breakdown
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

  const toggleWrSelect = (wrId) => {
    setSelectedWrIds(prev =>
      prev.includes(wrId) ? prev.filter(id => id !== wrId) : [...prev, wrId]
    );
  };

  const selectAllEligibleWrs = () => {
    setSelectedWrIds(eligibleWrs.map(w => w.id));
  };

  const handleCreate = async () => {
    const firstWr = selectedWrs[0];
    const customerName = selectedCustomer?.name || selectedCustomer?.companyName || firstWr?.consignee || firstWr?.customer || firstWr?.customerName || "Consignee Importer";

    const payload = {
      hblNumber: formData.hblNumber,
      customerId: selectedCustomer?.id,
      customerName: customerName,
      shipper: {
        name: firstWr?.shipper || "Global Retail Suppliers Inc.",
        address: "Miami CFS Cargo Hub, FL"
      },
      consignee: {
        name: customerName,
        address: selectedCustomer?.address || firstWr?.destinationPort || "Destination Port Area",
        taxId: selectedCustomer?.taxId || ""
      },
      notifyParty: {
        name: firstWr?.agentName || selectedCustomer?.agentName || (selectedCustomer?.destinationCode === 'NAS' ? "Caribbean Express Freight Ltd." : "Direct Consignee Delivery"),
        address: "Destination Port Cargo Terminal"
      },
      agentId: firstWr?.agentId || (selectedCustomer?.destinationCode === 'NAS' ? "AGT-001" : null),
      agentName: firstWr?.agentName || selectedCustomer?.agentName || (selectedCustomer?.destinationCode === 'NAS' ? "Caribbean Express Freight Ltd." : ""),
      originPort: "Port of Miami (USMIA), FL",
      destinationPort: selectedCustomer?.destinationPort || firstWr?.destinationPort || "NAS - Nassau, Bahamas",
      destinationCode: selectedCustomer?.destinationCode || firstWr?.destinationCode || "NAS",
      warehouseReceiptIds: selectedWrs.length > 0 ? selectedWrs.map(w => w.receiptNumber || w.id) : selectedWrIds,
      cargoDescription: combinedTotals.cargoDescriptions || "Commercial Cargo Goods",
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
      status: "Active",
      notes: formData.notes || `Created linking ${selectedWrIds.length} Warehouse Receipt(s).`
    };

    const created = await createHouseBill(payload);
    onNavigate('house-bills', created.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title="Create House Bill of Lading (HBL)"
        subtitle="Group staged Warehouse Receipts into a formal House transport document with rating & freight charges."
        icon={FileText}
        breadcrumbs={[
          { label: 'House Bills of Lading', href: '#' },
          { label: 'Create New' }
        ]}
        actions={
          <button
            onClick={() => onNavigate('house-bills')}
            className="btn btn-outline btn-sm"
          >
            <ArrowLeft size={15} />
            <span>Cancel</span>
          </button>
        }
      />

      {/* Step Indicator Bar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          {[
            { num: 1, label: '1. Select Customer' },
            { num: 2, label: '2. Link Staged WRs' },
            { num: 3, label: '3. Cargo Totals' },
            { num: 4, label: '4. Freight Rates & Issue' }
          ].map(step => (
            <div
              key={step.num}
              onClick={() => {
                if (step.num < currentStep || (step.num === 2 && selectedCustomerId) || (step.num === 3 && selectedWrIds.length > 0)) {
                  setCurrentStep(step.num);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: step.num <= currentStep ? 'pointer' : 'default',
                opacity: step.num > currentStep ? 0.5 : 1
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: currentStep === step.num ? '#0A192F' : currentStep > step.num ? '#10B981' : '#E2E8F0',
                  color: currentStep >= step.num ? '#FFFFFF' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}
              >
                {currentStep > step.num ? <Check size={16} /> : step.num}
              </div>
              <span style={{ fontWeight: currentStep === step.num ? 700 : 500, fontSize: '0.85rem', color: currentStep === step.num ? '#0A192F' : '#64748B' }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Select Customer */}
      {currentStep === 1 && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#0A192F', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={18} style={{ color: '#0284C7' }} />
                <span>Step 1: Select Customer Account Profile</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                Select the consignee account to load available Warehouse Receipts staged at CFS Miami.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.35rem 0.65rem' }}>
              <Search size={15} style={{ color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search customers..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem', width: '200px' }}
              />
              {customerSearch && (
                <button type="button" onClick={() => setCustomerSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 0 }}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {filteredCustomers.map(c => {
              const isSelected = selectedCustomerId === c.id;
              const stagedWrCount = warehouseReceipts.filter(w => 
                (w.customerId === c.id || w.customer === c.name || (w.consignee && w.consignee.includes(c.name))) &&
                (!w.assignedHouseBillId) &&
                (w.status !== 'Consolidated' && w.status !== 'Cancelled')
              ).length;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #0284C7' : '1px solid #E2E8F0',
                    background: isSelected ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                  className="card-hover"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, color: '#0A192F', fontSize: '0.95rem' }}>{c.name}</div>
                    {isSelected && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284C7' }} />}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 600, marginTop: '2px' }}>
                    {c.destinationPort}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '6px' }}>
                    Contact: {c.contactPerson} • {c.telephone || c.phone}
                  </div>
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E2E8F0', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Staged for HBL:</span>
                    <strong style={{ color: stagedWrCount > 0 ? '#059669' : '#64748B' }}>{stagedWrCount} Available WR(s)</strong>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <button
              onClick={() => setCurrentStep(2)}
              className="btn btn-primary"
            >
              <span>Proceed to Link Warehouse Receipts</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Select Warehouse Receipts */}
      {currentStep === 2 && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#0A192F', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={18} style={{ color: '#D97706' }} />
                <span>Step 2: Link Warehouse Receipts for {selectedCustomer?.name}</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                Select staged receipts in warehouse stock destined for <strong>{selectedCustomer?.destinationPort}</strong>.
              </p>
            </div>

            {eligibleWrs.length > 0 && (
              <button
                type="button"
                onClick={selectAllEligibleWrs}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.75rem' }}
              >
                Select All ({eligibleWrs.length} Available WRs)
              </button>
            )}
          </div>

          {eligibleWrs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
              <Package size={32} style={{ color: '#94A3B8', margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 600, color: '#334155' }}>No Unlinked Staged Warehouse Receipts Found</div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
                There are no unassigned warehouse receipts in inventory for {selectedCustomer?.name}.
              </div>
              <button
                onClick={() => onNavigate('warehouse-receipts', 'create')}
                className="btn btn-primary btn-sm mt-3"
              >
                + Intake New Warehouse Receipt
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <table className="data-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#0A192F', color: '#FFFFFF' }}>
                    <th style={{ width: '40px' }}>Select</th>
                    <th>WR Number</th>
                    <th>Intake Date</th>
                    <th>Cargo Description</th>
                    <th>Package Lines</th>
                    <th>Pieces</th>
                    <th>Gross Weight</th>
                    <th style={{ color: '#FBBF24' }}>CFT (Primary)</th>
                    <th style={{ color: '#38BDF8' }}>CBM</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleWrs.map(wr => {
                    const isSelected = selectedWrIds.includes(wr.id) || selectedWrIds.includes(wr.receiptNumber);
                    return (
                      <tr
                        key={wr.id}
                        onClick={() => toggleWrSelect(wr.id)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? '#EFF6FF' : '#FFFFFF'
                        }}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ fontWeight: 800, color: '#D97706', fontFamily: 'JetBrains Mono, monospace' }}>
                          {wr.receiptNumber}
                        </td>
                        <td>{wr.date}</td>
                        <td style={{ fontSize: '0.8rem', color: '#334155' }}>{wr.cargoDescription}</td>
                        <td>{wr.packages?.length || wr.packageCount} lines</td>
                        <td style={{ fontWeight: 700 }}>{wr.totalPieces || wr.total_pieces || wr.packageCount} pcs</td>
                        <td>{(Number(wr.weightLbs || wr.weight_lbs || 0)).toLocaleString()} lbs</td>
                        <td style={{ fontWeight: 800, color: '#D97706' }}>{Number(wr.totalCft || wr.total_cft || wr.cft || 0)} CFT</td>
                        <td style={{ fontWeight: 700, color: '#0284C7' }}>{Number(wr.totalCbm || wr.total_cbm || wr.cbm || 0)} CBM</td>
                        <td><StatusBadge status={wr.status} size="sm" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <button onClick={() => setCurrentStep(1)} className="btn btn-outline">
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
            <div style={{ fontSize: '0.85rem', color: '#334155' }}>
              Selected: <strong style={{ color: '#2563EB' }}>{selectedWrIds.length}</strong> WR(s) ({combinedTotals.totalPieces} pieces • {combinedTotals.totalCft} CFT / {combinedTotals.totalCbm} CBM)
            </div>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={selectedWrIds.length === 0}
              className="btn btn-primary"
            >
              <span>Proceed to Cargo Review</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review Combined Cargo */}
      {currentStep === 3 && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#0A192F', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calculator size={18} style={{ color: '#0284C7' }} />
              <span>Step 3: Review Aggregated Cargo Totals</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
              All information from the {selectedWrs.length} linked Warehouse Receipt(s) has been calculated.
            </p>
          </div>

          {/* 4 Combined Totals Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }} className="grid-cols-4-mobile">
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>LINKED WAREHOUSE RECEIPTS</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>
                {selectedWrs.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{selectedWrIds.join(', ')}</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>TOTAL PIECES</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A192F', marginTop: '4px' }}>
                {combinedTotals.totalPieces} <span style={{ fontSize: '0.9rem' }}>Pieces</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Across {combinedTotals.totalPackages} package lines</div>
            </div>

            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400E' }}>TOTAL CFT (PRIMARY)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#92400E', marginTop: '4px' }}>
                {combinedTotals.totalCft.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>CFT</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>({combinedTotals.totalCbm} CBM)</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>GROSS WEIGHT</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A192F', marginTop: '4px' }}>
                {combinedTotals.totalWeightLbs.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>lbs</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>({combinedTotals.totalWeightKg.toLocaleString()} kg)</div>
            </div>
          </div>

          {/* Linked Receipts Summary List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#64748B', textTransform: 'uppercase', margin: 0 }}>Linked Warehouse Receipts in this House B/L:</h4>
            {selectedWrs.map(wr => (
              <div key={wr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div>
                  <strong style={{ color: '#D97706', fontFamily: 'JetBrains Mono, monospace' }}>{wr.receiptNumber || wr.receipt_number}</strong> • {wr.customer || wr.customerName || wr.customer_name || wr.consignee}
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{wr.cargoDescription || wr.cargo_description}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                  <strong>{wr.totalPieces || wr.total_pieces || wr.packageCount} pieces</strong> • <span style={{ color: '#D97706', fontWeight: 700 }}>{Number(wr.totalCft || wr.total_cft || wr.cft || 0)} CFT</span> ({Number(wr.totalCbm || wr.total_cbm || wr.cbm || 0)} CBM)
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <button onClick={() => setCurrentStep(2)} className="btn btn-outline">
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
            <button onClick={() => setCurrentStep(4)} className="btn btn-primary">
              <span>Proceed to Input Rates &amp; Issue</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Freight Rates Input & Issue House B/L */}
      {currentStep === 4 && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#0A192F' }}>Step 4: Freight Rating &amp; Issuance Parameters</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                Input freight rate per CFT/CBM, handling fees, and payment terms to generate the House Bill of Lading.
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', padding: '0.3rem 0.75rem', borderRadius: '4px', fontWeight: 700 }}>
              Ready to Rate &amp; Issue
            </span>
          </div>

          {/* Header Inputs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">House B/L Number <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                value={formData.hblNumber}
                onChange={(e) => setFormData({ ...formData, hblNumber: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Issue Date <span className="required">*</span></label>
              <input
                type="date"
                className="form-control"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Freight Payment Terms</label>
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

          {/* ⭐ FREIGHT RATES & CHARGES ENTRY CARD ⭐ */}
          <div style={{ background: '#F0FDF4', border: '2px solid #86EFAC', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={20} style={{ color: '#16A34A' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#166534', margin: 0 }}>
                  Freight Rating &amp; Charges Calculator
                </h4>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
                Volume for Rating: <strong>{combinedTotals.totalCft} CFT</strong> ({combinedTotals.totalCbm} CBM)
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Rate Basis</label>
                <select
                  className="form-select"
                  value={formData.rateBasis}
                  onChange={(e) => setFormData({ ...formData, rateBasis: e.target.value })}
                >
                  <option value="cft">Per Cubic Foot ($/CFT)</option>
                  <option value="cbm">Per Cubic Meter ($/CBM)</option>
                  <option value="weight">Per 100 LBS ($/cwt)</option>
                  <option value="flat">Flat Rate ($)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ocean Rate ($ / unit)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  className="form-control"
                  style={{ fontWeight: 700 }}
                  value={formData.oceanFreightRate}
                  onChange={(e) => setFormData({ ...formData, oceanFreightRate: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Terminal / CFS Fee ($)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="form-control"
                  value={formData.terminalHandlingFee}
                  onChange={(e) => setFormData({ ...formData, terminalHandlingFee: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Documentation Fee ($)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="form-control"
                  value={formData.docFee}
                  onChange={(e) => setFormData({ ...formData, docFee: e.target.value })}
                />
              </div>
            </div>

            {/* Live Charges Breakdown Bar */}
            <div style={{ background: '#FFFFFF', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                Ocean Freight: <strong>${rateBreakdown.oceanCharge.toFixed(2)}</strong> + Handling: <strong>${rateBreakdown.terminalFee.toFixed(2)}</strong> + Docs: <strong>${rateBreakdown.docFee.toFixed(2)}</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 700 }}>Total B/L Charges:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#16A34A', fontFamily: 'JetBrains Mono, monospace' }}>
                  ${rateBreakdown.totalCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
            </div>
          </div>

          {/* Party & Cargo Summary Box */}
          <div className="grid grid-cols-2 gap-4" style={{ fontSize: '0.85rem' }}>
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#0A192F', marginBottom: '0.5rem' }}>Party Information</h4>
              <div><strong>Consignee:</strong> {selectedCustomer?.name}</div>
              <div><strong>Destination Port:</strong> {selectedCustomer?.destinationPort}</div>
              <div><strong>Terms:</strong> <span style={{ color: '#0284C7', fontWeight: 700 }}>{formData.freightTerms}</span></div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#0A192F', marginBottom: '0.5rem' }}>Cargo &amp; Rating Summary</h4>
              <div><strong>Linked WRs:</strong> {selectedWrs.length} Warehouse Receipts</div>
              <div><strong>Total Pieces:</strong> {combinedTotals.totalPieces} Pieces ({combinedTotals.totalWeightLbs.toLocaleString()} lbs)</div>
              <div><strong>Total Volume:</strong> <strong style={{ color: '#D97706' }}>{combinedTotals.totalCft} CFT</strong> ({combinedTotals.totalCbm} CBM)</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <button onClick={() => setCurrentStep(3)} className="btn btn-outline">
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
            <button onClick={handleCreate} className="btn btn-primary btn-lg">
              <Check size={18} />
              <span>Issue House Bill of Lading ({formData.hblNumber})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
