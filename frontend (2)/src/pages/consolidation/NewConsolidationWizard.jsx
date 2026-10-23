import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import {
  Layers,
  Check,
  ChevronRight,
  ChevronLeft,
  Package,
  Ship,
  Box,
  AlertCircle,
  FileText,
  Calculator,
  ArrowLeft,
  Building2
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';

export const NewConsolidationWizard = ({ onNavigate }) => {
  const { warehouseReceipts, houseBills, vessels, agents, ports, createConsolidation } = useAppData();
  const { currentUser, isAgent } = useAuth();

  const allAvailablePorts = useMemo(() => {
    const list = [...ports];
    warehouseReceipts.forEach(w => {
      if (w.destinationCode && !list.some(p => (p.code === w.destinationCode || p.port_code === w.destinationCode))) {
        list.push({ id: w.destinationCode, code: w.destinationCode, name: w.destinationPort || `${w.destinationCode} Port` });
      }
    });
    return list;
  }, [ports, warehouseReceipts]);

  const defaultVessels = [
    { id: 'VES-001', name: 'MV Island Explorer', type: 'Feeder Boat' },
    { id: 'VES-002', name: 'MV Atlantic Trader', type: 'Feeder Boat' },
    { id: 'VES-003', name: 'MV Caribbean Star', type: 'Feeder Boat' }
  ];
  const vesselOptions = (vessels && vessels.length > 0) ? vessels : defaultVessels;

  const defaultDestinationCode = isAgent
    ? (currentUser?.destinationPortCode || 'ALL')
    : 'ALL';

  const [currentStep, setCurrentStep] = useState(1);
  const [destinationFilter, setDestinationFilter] = useState(defaultDestinationCode);
  const [selectedWrIds, setSelectedWrIds] = useState([]);
  const [selectedHblIds, setSelectedHblIds] = useState([]);
  const [cargoTab, setCargoTab] = useState('wr'); // 'wr' | 'hbl'

  // Eligible staged Warehouse Receipts for chosen destination
  const availableReceipts = useMemo(() => {
    return warehouseReceipts.filter(w => {
      const matchDest = destinationFilter === 'ALL' || w.destinationCode === destinationFilter || w.destinationPort?.includes(destinationFilter);
      const isReady = w.status === 'Ready for Consolidation' || w.status === 'Received' || !w.assignedConsolidationId;
      return matchDest && isReady;
    });
  }, [warehouseReceipts, destinationFilter]);

  // Selected receipts objects
  const selectedReceipts = useMemo(() => {
    return warehouseReceipts.filter(w => selectedWrIds.includes(w.id) || selectedWrIds.includes(w.receiptNumber));
  }, [warehouseReceipts, selectedWrIds]);

  // Eligible House Bills for chosen destination
  const availableHouseBills = useMemo(() => {
    return houseBills.filter(h => {
      const matchDest = destinationFilter === 'ALL' || h.destinationCode === destinationFilter || h.destinationPort?.includes(destinationFilter);
      const isReady = !h.assignedConsolidationId;
      return matchDest && isReady;
    });
  }, [houseBills, destinationFilter]);

  // Selected House Bills objects
  const selectedHouseBills = useMemo(() => {
    return houseBills.filter(h => selectedHblIds.includes(h.id) || selectedHblIds.includes(h.hblNumber));
  }, [houseBills, selectedHblIds]);

  // Form State for Consolidation
  const [formData, setFormData] = useState({
    consolidationNumber: `CNS-2026-${Math.floor(100 + Math.random() * 899)}`,
    title: 'LCL Consolidated Ocean Box',
    destinationPort: '',
    destinationCode: '',
    agentId: '',
    agentName: '',
    vesselName: '',
    carrier: 'Tropical Shipping Line',
    containerNumber: '',
    containerType: "40' Standard GP",
    sealNumber: `SEAL-VI-${Math.floor(10000 + Math.random() * 90000)}`,
    loadingPort: 'Port of Miami (USMIA)',
    dischargePort: '',
    etd: new Date().toISOString().split('T')[0],
    eta: '2026-09-06',
    notes: 'Consolidated commercial imports and retail cargo.'
  });

  // Calculate totals from selected Warehouse Receipts and House Bills
  const totals = useMemo(() => {
    let totalPieces = 0;
    let totalPackages = 0;
    let totalWeightLbs = 0;
    let totalCft = 0;
    let totalCbm = 0;

    selectedReceipts.forEach(w => {
      totalPieces += Number(w.totalPieces || w.total_pieces || w.packageCount || 1);
      totalPackages += Number(w.packageCount || 1);
      totalWeightLbs += Number(w.weightLbs || w.weight_lbs || 0);
      totalCft += Number(w.totalCft || w.total_cft || w.cft || 0);
      totalCbm += Number(w.totalCbm || w.total_cbm || w.cbm || 0);
    });

    selectedHouseBills.forEach(h => {
      totalPieces += Number(h.totalPieces || h.packageCount || 1);
      totalPackages += Number(h.totalPackages || h.packageCount || 1);
      totalWeightLbs += Number(h.totalWeightLbs || 0);
      totalCft += Number(h.totalCft || 0);
      totalCbm += Number(h.totalCbm || 0);
    });

    const totalWeightKg = Number((totalWeightLbs * 0.453592).toFixed(1));
    totalCft = Number(totalCft.toFixed(2));
    totalCbm = Number(totalCbm.toFixed(2));

    return {
      totalReceipts: selectedReceipts.length,
      receiptIds: selectedReceipts.map(r => r.id || r.receiptNumber),
      totalHouseBills: selectedHouseBills.length,
      houseBillIds: selectedHouseBills.map(h => h.hblNumber || h.id),
      totalPackages,
      totalPieces,
      totalWeightLbs,
      totalWeightKg,
      totalCft,
      totalCbm
    };
  }, [selectedReceipts, selectedHouseBills]);

  const toggleWrSelect = (id) => {
    setSelectedWrIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleHblSelect = (id) => {
    setSelectedHblIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const ids = availableReceipts.map(w => w.id || w.receiptNumber);
    setSelectedWrIds(ids);
  };

  const selectAllHbls = () => {
    const ids = availableHouseBills.map(h => h.hblNumber || h.id);
    setSelectedHblIds(ids);
  };

  const handleDestinationChange = (destCode) => {
    setDestinationFilter(destCode);
    setSelectedWrIds([]);
    setSelectedHblIds([]);
    const portObj = allAvailablePorts.find(p => p.code === destCode || p.port_code === destCode);
    const portName = portObj ? `${portObj.code || portObj.port_code} - ${portObj.name}` : (destCode === 'ALL' ? 'All Destinations' : `${destCode} Port`);
    const dischargeName = portObj ? `Port of ${portObj.name}` : `${destCode} Port`;

    setFormData(prev => ({
      ...prev,
      destinationCode: destCode === 'ALL' ? '' : destCode,
      destinationPort: destCode === 'ALL' ? '' : portName,
      dischargePort: destCode === 'ALL' ? '' : dischargeName,
      title: `${destCode === 'ALL' ? 'General' : destCode} LCL Consolidated Ocean Box`
    }));
  };

  const handleCreate = async () => {
    const payload = {
      ...formData,
      consolidationNumber: formData.consolidationNumber,
      receiptIds: totals.receiptIds,
      houseBillIds: totals.houseBillIds,
      totalReceipts: totals.totalReceipts,
      totalHouseBills: totals.totalHouseBills,
      totalPackages: totals.totalPackages,
      totalPieces: totals.totalPieces,
      totalWeightLbs: totals.totalWeightLbs,
      totalWeightKg: totals.totalWeightKg,
      totalCft: totals.totalCft,
      totalCbm: totals.totalCbm
    };

    await createConsolidation(payload);
    onNavigate('consolidations');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title="Consolidation Wizard"
        subtitle="Group staged warehouse cargo into destination ocean containers and generate master shipments."
        icon={Layers}
        breadcrumbs={[
          { label: 'Operations', href: '#' },
          { label: 'Consolidations', href: '#' },
          { label: 'New Consolidation' }
        ]}
        actions={
          <button
            onClick={() => onNavigate('consolidations')}
            className="btn btn-outline btn-sm"
          >
            <ArrowLeft size={15} />
            <span>Cancel</span>
          </button>
        }
      />

      <WorkflowIndicator currentStage="consolidations" onNavigate={onNavigate} />

      {/* 4-Step Stepper Header */}
      <div className="card" style={{ padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }} className="grid-cols-4-mobile">
          {[
            { num: 1, label: 'Step 1: Select Cargo' },
            { num: 2, label: 'Step 2: Review Cargo' },
            { num: 3, label: 'Step 3: Container' },
            { num: 4, label: 'Step 4: Shipment Details' }
          ].map(step => (
            <div
              key={step.num}
              onClick={() => setCurrentStep(step.num)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                opacity: 1
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
                  fontSize: '0.8rem',
                  flexShrink: 0
                }}
              >
                {currentStep > step.num ? <Check size={16} /> : step.num}
              </div>
              <span style={{ fontWeight: currentStep === step.num ? 700 : 500, fontSize: '0.825rem', color: currentStep === step.num ? '#0A192F' : '#64748B' }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Select Cargo */}
      {currentStep === 1 && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#0A192F', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Layers size={18} style={{ color: '#0284C7' }} />
                <span>Step 1: Select Cargo</span>
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '4px 0 0' }}>
                “Choose staged Warehouse Receipts to consolidate.”
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Destination:</span>
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '200px', padding: '0.3rem 0.6rem', fontSize: '0.8rem', fontWeight: 700 }}
                value={destinationFilter}
                onChange={(e) => handleDestinationChange(e.target.value)}
              >
                <option value="ALL">All Destinations</option>
                {allAvailablePorts.map(p => (
                  <option key={p.id || p.code || p.port_code} value={p.code || p.port_code}>
                    {p.code || p.port_code} — {p.name}
                  </option>
                ))}
              </select>
              {availableReceipts.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: '0.75rem' }}
                >
                  Select All ({availableReceipts.length} WRs)
                </button>
              )}
            </div>
          </div>

          {/* Cargo Source Switcher: Warehouse Receipts vs House Bills */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setCargoTab('wr')}
              className={`btn btn-sm ${cargoTab === 'wr' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.8rem' }}
            >
              <Package size={14} />
              <span>Warehouse Receipts ({selectedWrIds.length} / {availableReceipts.length} selected)</span>
            </button>
            <button
              type="button"
              onClick={() => setCargoTab('hbl')}
              className={`btn btn-sm ${cargoTab === 'hbl' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.8rem' }}
            >
              <FileText size={14} />
              <span>House Bills of Lading ({selectedHblIds.length} / {availableHouseBills.length} selected)</span>
            </button>
          </div>

          {/* Table of Available Staged Warehouse Receipts */}
          {cargoTab === 'wr' && (
            availableReceipts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                <Package size={36} style={{ color: '#94A3B8', margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0A192F' }}>No Staged Cargo Yet for {destinationFilter}</div>
                <div style={{ fontSize: '0.825rem', color: '#64748B', marginTop: '4px' }}>
                  Create a Warehouse Receipt to add cargo to the consolidation queue.
                </div>
                <button
                  onClick={() => onNavigate('warehouse-receipts', 'create')}
                  className="btn btn-primary btn-sm mt-3"
                >
                  + Create Warehouse Receipt
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px', textAlign: 'center' }}>Select</th>
                      <th>WR #</th>
                      <th>Customer / Consignee</th>
                      <th>Cargo Description</th>
                      <th>Pieces</th>
                      <th>Weight</th>
                      <th>Volume (CFT / CBM)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableReceipts.map(wr => {
                      const isSelected = selectedWrIds.includes(wr.id) || selectedWrIds.includes(wr.receiptNumber);
                      return (
                        <tr
                          key={wr.id}
                          onClick={() => toggleWrSelect(wr.id || wr.receiptNumber)}
                          style={{
                            cursor: 'pointer',
                            background: isSelected ? '#EFF6FF' : '#FFFFFF'
                          }}
                        >
                          <td style={{ textAlign: 'center' }}>
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
                          <td style={{ fontWeight: 600 }}>{wr.customer || wr.customerName || wr.customer_name || wr.consignee}</td>
                          <td style={{ fontSize: '0.8rem', color: '#334155' }}>{wr.cargoDescription || wr.cargo_description}</td>
                          <td style={{ fontWeight: 700 }}>{wr.totalPieces || wr.total_pieces || wr.packageCount} pcs</td>
                          <td>{(Number(wr.weightLbs || wr.weight_lbs || 0)).toLocaleString()} lbs</td>
                          <td>
                            <strong style={{ color: '#D97706' }}>{Number(wr.totalCft || wr.total_cft || wr.cft || 0)} CFT</strong> <span style={{ color: '#0284C7', fontSize: '0.75rem' }}>({Number(wr.totalCbm || wr.total_cbm || wr.cbm || 0)} CBM)</span>
                          </td>
                          <td><StatusBadge status={wr.status} size="sm" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Table of Available House Bills of Lading */}
          {cargoTab === 'hbl' && (
            availableHouseBills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                <FileText size={36} style={{ color: '#94A3B8', margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0A192F' }}>No Unconsolidated House B/Ls for {destinationFilter}</div>
                <div style={{ fontSize: '0.825rem', color: '#64748B', marginTop: '4px' }}>
                  Issue a customer House B/L to consolidate by House B/L reference.
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('house-bills', 'create')}
                  className="btn btn-primary btn-sm mt-3"
                >
                  + Issue House B/L
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px', textAlign: 'center' }}>Select</th>
                      <th>House B/L #</th>
                      <th>Consignee</th>
                      <th>Shipper</th>
                      <th>Pieces</th>
                      <th>Weight</th>
                      <th>Volume</th>
                      <th>Destination</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableHouseBills.map(hb => {
                      const isSelected = selectedHblIds.includes(hb.id) || selectedHblIds.includes(hb.hblNumber);
                      const cft = hb.totalCft || (hb.totalCbm ? Number((hb.totalCbm * 35.3147).toFixed(1)) : 0);
                      return (
                        <tr
                          key={hb.id || hb.hblNumber}
                          onClick={() => toggleHblSelect(hb.hblNumber || hb.id)}
                          style={{
                            cursor: 'pointer',
                            background: isSelected ? '#EFF6FF' : '#FFFFFF'
                          }}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ fontWeight: 800, color: '#0284C7', fontFamily: 'JetBrains Mono, monospace' }}>
                            {hb.hblNumber}
                          </td>
                          <td style={{ fontWeight: 600 }}>{hb.consignee?.name || hb.consignee || 'Consignee'}</td>
                          <td style={{ fontSize: '0.8rem', color: '#334155' }}>{hb.shipper?.name || hb.shipper || 'Shipper'}</td>
                          <td style={{ fontWeight: 700 }}>{hb.totalPieces || hb.totalPackages || 1} pcs</td>
                          <td>{(Number(hb.totalWeightLbs || 0)).toLocaleString()} lbs</td>
                          <td>
                            <strong style={{ color: '#D97706' }}>{cft} CFT</strong> <span style={{ color: '#0284C7', fontSize: '0.75rem' }}>({hb.totalCbm || 0} CBM)</span>
                          </td>
                          <td style={{ color: '#0284C7' }}>{hb.destinationPort}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.85rem', color: '#334155' }}>
              Selected: <strong style={{ color: '#0284C7' }}>{selectedWrIds.length}</strong> Warehouse Receipt(s) ({totals.totalPieces} pieces • {totals.totalCft} CFT)
            </div>
            <button
              onClick={() => setCurrentStep(2)}
              className="btn btn-primary"
            >
              <span>Next: Review Cargo</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Review Cargo */}
      {currentStep === 2 && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#0A192F', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <Calculator size={18} style={{ color: '#0284C7' }} />
              <span>Step 2: Review Cargo</span>
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '4px 0 0' }}>
              Summary totals for selected Warehouse Receipts ready for ocean container consolidation.
            </p>
          </div>

          {/* Prompt Section 8: Show Totals: Pieces, Weight, CFT, CBM */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }} className="grid-cols-4-mobile">
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>PIECES</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0A192F', marginTop: '4px' }}>
                {totals.totalPieces}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>({totals.totalReceipts} Warehouse Receipts)</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>WEIGHT</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0A192F', marginTop: '4px' }}>
                {totals.totalWeightLbs.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>lbs</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>({totals.totalWeightKg.toLocaleString()} kg)</div>
            </div>

            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1.25rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>CFT (PRIMARY)</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#D97706', marginTop: '4px' }}>
                {totals.totalCft} <span style={{ fontSize: '0.9rem' }}>CFT</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#92400E' }}>Cubic Feet Volume</div>
            </div>

            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1.25rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase' }}>CBM (METRIC)</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0284C7', marginTop: '4px' }}>
                {totals.totalCbm} <span style={{ fontSize: '0.9rem' }}>CBM</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#1E40AF' }}>Cubic Meters</div>
            </div>
          </div>

          {/* List of Cargo Included */}
          <div>
            <h4 style={{ fontSize: '0.85rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Cargo Staged in this Consolidation:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {selectedReceipts.map(wr => (
                <div
                  key={wr.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: '#F8FAFC',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <div>
                    <strong style={{ color: '#D97706', fontFamily: 'JetBrains Mono, monospace' }}>{wr.receiptNumber || wr.receipt_number}</strong> • {wr.customer || wr.customerName || wr.customer_name || wr.consignee}
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{wr.cargoDescription || wr.cargo_description}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.825rem' }}>
                    <strong>{wr.totalPieces || wr.total_pieces || wr.packageCount} pieces</strong> • <strong style={{ color: '#D97706' }}>{Number(wr.totalCft || wr.total_cft || wr.cft || 0)} CFT</strong> ({Number(wr.totalCbm || wr.total_cbm || wr.cbm || 0)} CBM)
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <button onClick={() => setCurrentStep(1)} className="btn btn-outline">
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
            <button onClick={() => setCurrentStep(3)} className="btn btn-primary">
              <span>Next: Select Container</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Container */}
      {currentStep === 3 && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#0A192F', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <Box size={18} style={{ color: '#0284C7' }} />
              <span>Step 3: Container</span>
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '4px 0 0' }}>
              Assign ocean container number and type for destination shipment.
            </p>
          </div>

          {/* Consolidation Number & Container Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Consolidation Number <span className="required">*</span></span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    consolidationNumber: `CNS-2026-${Math.floor(100 + Math.random() * 899)}`
                  }))}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '0 4px', fontSize: '0.72rem', color: '#0284C7', height: 'auto' }}
                  title="Generate new consolidation number"
                >
                  Auto Generate
                </button>
              </label>
              <input
                type="text"
                className="form-control font-mono"
                value={formData.consolidationNumber}
                onChange={(e) => setFormData({ ...formData, consolidationNumber: e.target.value })}
                placeholder="e.g. CNS-2026-0001 (or enter custom number)"
                required
              />
              <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px', display: 'block' }}>
                Auto-generated reference or client's custom consolidation number.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Container Type <span className="required">*</span></label>
              <select
                className="form-select"
                value={formData.containerType}
                onChange={(e) => setFormData({ ...formData, containerType: e.target.value })}
              >
                <option value="40' Standard GP">40' Standard GP</option>
                <option value="40' High Cube">40' High Cube</option>
                <option value="20' Standard GP">20' Standard GP</option>
                <option value="45' High Cube">45' High Cube</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Container Number <span className="required">*</span></label>
            <input
              type="text"
              className="form-control font-mono"
              value={formData.containerNumber}
              onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
              placeholder="e.g. CMAU-109482-7"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                CONSOLIDATION REF
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0369A1', marginTop: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                {formData.consolidationNumber}
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                CONTAINER TYPE
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0A192F', marginTop: '4px' }}>
                {formData.containerType}
              </div>
            </div>

            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>
                TOTAL CARGO VOLUME
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284C7', marginTop: '4px' }}>
                {totals.totalCft} CFT
              </div>
              <div style={{ fontSize: '0.72rem', color: '#1E40AF' }}>({totals.totalCbm} CBM • {totals.totalWeightLbs?.toLocaleString()} lbs)</div>
            </div>
          </div>



          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <button onClick={() => setCurrentStep(2)} className="btn btn-outline">
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
            <button onClick={() => setCurrentStep(4)} className="btn btn-primary">
              <span>Next: Shipment Details</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Shipment Details */}
      {currentStep === 4 && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#0A192F', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <Ship size={18} style={{ color: '#0284C7' }} />
              <span>Step 4: Shipment Details</span>
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '4px 0 0' }}>
              Enter vessel and transport identifiers to finalize consolidation.
            </p>
          </div>

          {/* Section: Vessel, Container, Seal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Ocean Vessel <span className="required">*</span></label>
              <select
                className="form-select"
                value={formData.vesselName}
                onChange={(e) => {
                  const selectedVesselName = e.target.value;
                  const vPrefix = selectedVesselName.split(' ').map(w => w[0]).join('').toUpperCase();
                  const newContainer = `${vPrefix}U-${Math.floor(100000 + Math.random() * 900000)}-${Math.floor(Math.random() * 9)}`;
                  const newSeal = `SEAL-VI-${Math.floor(10000 + Math.random() * 90000)}`;
                  setFormData(prev => ({
                    ...prev,
                    vesselName: selectedVesselName,
                    containerNumber: newContainer,
                    sealNumber: newSeal
                  }));
                }}
              >
                {vesselOptions.map(v => (
                  <option key={v.id || v.name} value={v.name}>{v.name} ({v.type || 'Container Vessel'})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Carrier</label>
              <input
                type="text"
                className="form-control"
                value={formData.carrier}
                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Container Number <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                value={formData.containerNumber}
                onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bolt Seal Number <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                value={formData.sealNumber}
                onChange={(e) => setFormData({ ...formData, sealNumber: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Summary Banner */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem 1.25rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0A192F', fontSize: '0.95rem' }}>
                {formData.consolidationNumber} • {formData.vesselName} • {formData.dischargePort}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Container: {formData.containerNumber} ({formData.containerType}) • Seal: {formData.sealNumber}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, color: '#D97706', fontSize: '1rem' }}>
                {totals.totalCft} CFT ({totals.totalCbm} CBM)
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                {totals.totalReceipts} WRs • {totals.totalPieces} Pieces
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <button onClick={() => setCurrentStep(3)} className="btn btn-outline">
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
            <button onClick={handleCreate} className="btn btn-primary btn-lg">
              <Check size={18} />
              <span>Create Consolidation &amp; Shipment</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
