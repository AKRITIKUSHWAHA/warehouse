import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Package,
  Calculator,
  Check,
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  Anchor,
  Box,
  Layers,
  MapPin,
  Search,
  UserCheck
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { BarcodeVisual, QrVisual } from '../../components/common/BarcodeVisual';
import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';
import { CustomerModal } from '../../components/modals/CustomerModal';
import { useAuth } from '../../context/AuthContext';

export const CreateWarehouseReceipt = ({ onNavigate }) => {
  const { createWarehouseReceipt, customers, agents, ports, warehouseReceipts, createCustomer, settings } = useAppData();
  const { currentUser, isDocs, isSuperAdmin } = useAuth();
  const canEditWR = isDocs || isSuperAdmin;

  const configuredPrefix = settings?.numberingRules?.warehouseReceiptPrefix?.trim();
  const maxSeq = warehouseReceipts.reduce((max, r) => {
    const raw = String(r.receiptNumber || r.sequenceNumber || '');
    const match = raw.match(/(\d+)$/);
    const num = match ? parseInt(match[1], 10) : NaN;
    return !isNaN(num) && num > max ? num : max;
  }, 3099);
  const nextSeq = Math.max(3100, maxSeq + 1);
  const initialReceiptNum = configuredPrefix
    ? (configuredPrefix.endsWith('-') ? `${configuredPrefix}${nextSeq}` : `${configuredPrefix}-${nextSeq}`)
    : String(nextSeq);

  const getPortCode = (p) => p?.portCode || p?.code || 'NAS';
  const nasPort = ports.find(p => getPortCode(p) === 'NAS') || ports[0];
  const defaultPort = nasPort ? `${getPortCode(nasPort)} - ${nasPort.name}` : 'NAS - Nassau Container Port';
  const defaultPortCode = nasPort ? getPortCode(nasPort) : 'NAS';
  const initialAgent = agents.find(a => a.assignedPortCode === defaultPortCode);
  const initialAgentName = initialAgent?.name || nasPort?.defaultAgent || '';

  // Form Header State (Fresh Blank State)
  const [formData, setFormData] = useState({
    receiptNumber: initialReceiptNum,
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    customer: '',
    customerName: '',
    shipper: '',
    consignee: '',
    agentId: initialAgent?.id || null,
    agentName: initialAgentName,
    destinationPort: defaultPort,
    destinationCode: defaultPortCode,
    warehouseLocation: 'General Staging',
    cargoDescription: '',
    unitType: 'inches', // 'inches' | 'cm'
    hazardous: false,
    fragile: false,
    notes: ''
  });

  // Package Level Rows State (Starts Fresh with 1 Clean Row)
  const [packages, setPackages] = useState([
    {
      id: 'PKG-001',
      packageType: 'Carton',
      description: '',
      lengthInches: '',
      widthInches: '',
      heightInches: '',
      weightLbs: '',
      pieces: 1,
      cbm: 0
    }
  ]);

  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [customerCreationTarget, setCustomerCreationTarget] = useState(null);

  // Handle Customer Selection -> Auto-populate customer and destination ONLY (Unlinked from Consignee)
  const handleCustomerSelect = (custId) => {
    if (!custId) {
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customer: '',
        customerName: ''
      }));
      return;
    }

    const selected = customers.find(c => c.id === custId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        customerId: selected.id,
        customer: selected.name,
        customerName: selected.name,
        destinationPort: selected.destinationPort || prev.destinationPort,
        destinationCode: selected.destinationCode || prev.destinationCode
      }));
    }
  };

  // Quick fill Consignee from registered accounts
  const handleConsigneeSelect = (custId) => {
    if (!custId) return;
    if (custId === 'CREATE_NEW') {
      setCustomerCreationTarget('consignee');
      setShowAddCustomerModal(true);
      return;
    }
    const selected = customers.find(c => c.id === custId);
    if (selected) {
      const destP = selected.destinationPort || formData.destinationPort;
      const destC = selected.destinationCode || (destP && destP.includes(' - ') ? destP.split(' - ')[0].trim() : formData.destinationCode);
      const portObj = ports.find(p => getPortCode(p) === destC);
      const matchedAgent = agents.find(a => a.assignedPortCode === destC);
      const matchedAgentName = matchedAgent?.name || portObj?.defaultAgent || '';
      const matchedAgentId = matchedAgent?.id || null;

      setFormData(prev => ({
        ...prev,
        customerId: selected.id,
        customer: selected.name,
        customerName: selected.name,
        consignee: `${selected.name}\n${selected.address || ''}\nAttn: ${selected.contactPerson || ''} (${selected.telephone || ''})`.trim(),
        destinationPort: destP,
        destinationCode: destC,
        agentId: matchedAgentId,
        agentName: matchedAgentName
      }));
    }
  };

  // Quick fill Shipper from registered contacts
  const handleShipperSelect = (custId) => {
    if (!custId) return;
    if (custId === 'CREATE_NEW') {
      setCustomerCreationTarget('shipper');
      setShowAddCustomerModal(true);
      return;
    }
    const selected = customers.find(c => c.id === custId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        shipper: `${selected.name}\n${selected.address || ''}\nPhone: ${selected.telephone || ''}`.trim()
      }));
    }
  };

  // Recalculate package row CFT/CBM
  const calculateRowDimensions = (pkg, unitType) => {
    const l = Number(pkg.lengthInches) || 0;
    const w = Number(pkg.widthInches) || 0;
    const h = Number(pkg.heightInches) || 0;
    const pcs = Number(pkg.pieces) || 1;

    let cft = 0;
    let cbm = 0;

    if (l > 0 && w > 0 && h > 0) {
      if (unitType === 'inches') {
        // CFT = (L * W * H * pieces) / 1728
        cft = Number(((l * w * h * pcs) / 1728).toFixed(2));
        cbm = Number((cft * 0.0283168).toFixed(2));
      } else {
        // cm: CBM = (L * W * H * pieces) / 1,000,000
        cbm = Number(((l * w * h * pcs) / 1000000).toFixed(2));
        cft = Number((cbm * 35.3147).toFixed(2));
      }
    }

    return { ...pkg, cft, cbm };
  };

  // Add a new package row
  const addPackageRow = () => {
    const nextPkgNum = String(packages.length + 1).padStart(3, '0');
    const newPkg = calculateRowDimensions({
      id: `PKG-${nextPkgNum}`,
      packageType: 'Carton',
      description: '',
      lengthInches: '',
      widthInches: '',
      heightInches: '',
      weightLbs: '',
      pieces: 1,
      cft: 0,
      cbm: 0
    }, formData.unitType);

    setPackages(prev => [...prev, newPkg]);
  };

  // Update a single package row
  const updatePackageRow = (index, field, value) => {
    setPackages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      updated[index] = calculateRowDimensions(updated[index], formData.unitType);
      return updated;
    });
  };

  // Remove a package row
  const removePackageRow = (index) => {
    if (packages.length <= 1) return;
    setPackages(prev => prev.filter((_, idx) => idx !== index));
  };

  // Re-calculate all packages when unit switcher changes
  useEffect(() => {
    setPackages(prev => prev.map(pkg => calculateRowDimensions(pkg, formData.unitType)));
  }, [formData.unitType]);

  // Aggregated totals
  const totals = packages.reduce(
    (acc, pkg) => {
      acc.totalPieces += Number(pkg.pieces) || 0;
      acc.totalWeightLbs += Number(pkg.weightLbs) || 0;
      acc.totalCft += Number(pkg.cft) || 0;
      acc.totalCbm += Number(pkg.cbm) || 0;
      return acc;
    },
    { totalPieces: 0, totalWeightLbs: 0, totalCft: 0, totalCbm: 0 }
  );

  const totalWeightKg = Number((totals.totalWeightLbs * 0.453592).toFixed(1));
  const roundedCft = Number(totals.totalCft.toFixed(2));
  const roundedCbm = Number(totals.totalCbm.toFixed(2));
  const volumetricWeightLbs = Number((roundedCft * 10.4).toFixed(1));
  const volumetricWeightKg = Number((roundedCbm * 167).toFixed(1));

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'agentId') {
        const found = agents.find(a => a.id === value);
        if (found) updated.agentName = found.name;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Duplicate Check for Manual WR
    if (warehouseReceipts.some(wr => wr.receiptNumber === formData.receiptNumber)) {
      alert(`Warehouse Receipt Number ${formData.receiptNumber} already exists. Please use a unique number.`);
      return;
    }

    // Prepare package descriptions summary
    const descSummary = packages
      .filter(p => p.description)
      .map(p => `${p.pieces}x ${p.packageType} (${p.description})`)
      .join(', ');

    const payload = {
      ...formData,
      receivedBy: currentUser?.name ? `${currentUser.name} (${currentUser.role || 'Super Administrator'})` : 'CFS Receiving Operations',
      receivedByRole: currentUser?.role || 'Receiving Officer',
      customer: formData.customer || formData.customerName || (formData.consignee ? formData.consignee.split('\n')[0] : 'General Consignee'),
      customerName: formData.customerName || formData.customer || (formData.consignee ? formData.consignee.split('\n')[0] : 'General Consignee'),
      packages,
      packageCount: packages.length,
      totalPieces: totals.totalPieces || 1,
      weightLbs: totals.totalWeightLbs || 0,
      weightKg: totalWeightKg,
      cft: roundedCft,
      cbm: roundedCbm,
      volumetricWeightLbs,
      volumetricWeightKg,
      warehouseLocation: formData.warehouseLocation || 'General Staging',
      cargoDescription: descSummary || formData.cargoDescription || 'General Cargo Merchandise',
      status: "Ready for Consolidation"
    };

    const created = await createWarehouseReceipt(payload);
    onNavigate('warehouse-receipts', created?.id || created?.receiptNumber);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader
        title="Create Warehouse Receipt"
        subtitle="Intake cargo with package-level dimensions, automatic CFT/CBM calculation, and customer profile linking."
        icon={Package}
        breadcrumbs={[
          { label: 'Warehouse Receipts', href: '#' },
          { label: 'Create New' }
        ]}
        actions={
          <button
            onClick={() => onNavigate('warehouse-receipts')}
            className="btn btn-outline btn-sm"
          >
            <ArrowLeft size={15} />
            <span>Cancel &amp; Return</span>
          </button>
        }
      />

      <WorkflowIndicator currentStage="warehouse-receipts" onNavigate={onNavigate} />

      <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-5">
        {/* Left Column: Intake Form (8 cols) */}
        <div style={{ gridColumn: 'span 8' }} className="col-span-8-mobile">
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Section 1: Cargo Information (Shipper, Consignee & Destination) */}
            <div>
              <h3 style={{ fontSize: '1rem', color: '#0A192F', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={18} style={{ color: '#0284C7' }} />
                <span>1. Cargo Information — Shipper, Consignee &amp; Destination</span>
              </h3>

              {/* Customer Account & Destination Port */}
              <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Customer Account Profile</label>
                  <select
                    className="form-select"
                    value={formData.customerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                  >
                    <option value="">-- Select Customer Account (Optional) --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerNumber || c.id}) — {c.destinationCode}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '3px' }}>
                    Select customer to auto-fill details, or type Shipper &amp; Consignee manually below.
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Destination Port / Island <span className="required">*</span></label>
                  <select
                    className="form-select"
                    value={formData.destinationPort}
                    onChange={(e) => {
                      const dest = e.target.value;
                      const code = dest.includes(' - ') ? dest.split(' - ')[0].trim() : dest;
                      const portObj = ports.find(p => getPortCode(p) === code);
                      const matchedAgent = agents.find(a => a.assignedPortCode === code);
                      const matchedAgentName = matchedAgent?.name || portObj?.defaultAgent || '';
                      const matchedAgentId = matchedAgent?.id || null;
                      setFormData(prev => ({
                        ...prev,
                        destinationPort: dest,
                        destinationCode: code,
                        agentId: matchedAgentId,
                        agentName: matchedAgentName
                      }));
                    }}
                    required
                  >
                    {ports.map(p => {
                      const pCode = getPortCode(p);
                      return (
                        <option key={p.id || pCode} value={`${pCode} - ${p.name}`}>
                          {pCode} — {p.name} ({p.island || p.country})
                        </option>
                      );
                    })}
                  </select>
                  <div style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 600, marginTop: '3px' }}>
                    Destination flows into 4x6 Label, House B/L, Consolidation, and Manifest.
                  </div>
                </div>
              </div>

              {/* Receipt Number & Date */}
              <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Warehouse Receipt # <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.receiptNumber}
                    onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
                    disabled={!canEditWR}
                    title={canEditWR ? "Editable by Documentation/Admin" : "Auto-generated"}
                    required
                  />
                  {!canEditWR && (
                    <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '4px' }}>
                      Auto-generated numeric ID
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">CFS Receiving Date <span className="required">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Separate Shipper & Consignee */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Shipper / Supplier Information</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <select
                        style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', maxWidth: '170px' }}
                        onChange={(e) => handleShipperSelect(e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>Quick Fill Shipper...</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.customerNumber || c.id})
                          </option>
                        ))}
                        <option value="CREATE_NEW" style={{ fontWeight: 'bold', color: '#0284C7' }}>+ Create New Customer</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerCreationTarget('shipper');
                          setShowAddCustomerModal(true);
                        }}
                        className="btn btn-outline btn-xs"
                        style={{ padding: '2px 6px', fontSize: '0.7rem', color: '#0284C7', borderColor: '#0284C7' }}
                        title="Add New Customer Profile"
                      >
                        + New
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Enter Shipper / Vendor name, origin warehouse, address, phone..."
                    value={formData.shipper}
                    onChange={(e) => handleInputChange('shipper', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Consignee / Destination Importer <span className="required">*</span></label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <select
                        style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', maxWidth: '170px' }}
                        onChange={(e) => handleConsigneeSelect(e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>Quick Fill Consignee...</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.destinationCode ? `${c.destinationCode} • ` : ''}{c.customerNumber || c.id})
                          </option>
                        ))}
                        <option value="CREATE_NEW" style={{ fontWeight: 'bold', color: '#0284C7' }}>+ Create New Customer</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerCreationTarget('consignee');
                          setShowAddCustomerModal(true);
                        }}
                        className="btn btn-outline btn-xs"
                        style={{ padding: '2px 6px', fontSize: '0.7rem', color: '#0284C7', borderColor: '#0284C7' }}
                        title="Add New Customer Profile"
                      >
                        + New
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    required
                    placeholder="Enter Consignee name, island address, contact person, phone..."
                    value={formData.consignee}
                    onChange={(e) => handleInputChange('consignee', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Package-Level Entry Table with Explicit L/W/H Dimensions */}
            <div style={{ background: '#F8FAFC', border: '2px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', color: '#0A192F', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <Calculator size={18} style={{ color: '#0284C7' }} />
                    <span>2. Package Dimensions &amp; Automatic CFT / CBM Math</span>
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Enter Length, Width, and Height for each package. Volume (CFT &amp; CBM) calculates live.
                  </div>
                </div>

                {/* Unit Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#FFFFFF', padding: '3px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                  <button
                    type="button"
                    onClick={() => handleInputChange('unitType', 'inches')}
                    className={`btn btn-sm ${formData.unitType === 'inches' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    Inches (LBS / CFT)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('unitType', 'cm')}
                    className={`btn btn-sm ${formData.unitType === 'cm' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    Centimeters (KG / CBM)
                  </button>
                </div>
              </div>

              {/* Package Rows Table (High Visibility & Responsiveness) */}
              <div style={{ overflowX: 'auto', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#FFFFFF', marginBottom: '1rem' }}>
                <table className="data-table" style={{ fontSize: '0.82rem', minWidth: '850px' }}>
                  <thead>
                    <tr style={{ background: '#0A192F', color: '#FFFFFF', textAlign: 'left' }}>
                      <th style={{ width: '85px', padding: '0.6rem 0.5rem' }}>Pkg #</th>
                      <th style={{ width: '130px', padding: '0.6rem 0.5rem' }}>Pkg Type</th>
                      <th style={{ minWidth: '180px', padding: '0.6rem 0.5rem' }}>Description of Contents</th>
                      <th style={{ width: '85px', textAlign: 'center', padding: '0.6rem 0.4rem', background: '#0F2744' }}>
                        Length ({formData.unitType === 'inches' ? 'in' : 'cm'})
                      </th>
                      <th style={{ width: '85px', textAlign: 'center', padding: '0.6rem 0.4rem', background: '#0F2744' }}>
                        Width ({formData.unitType === 'inches' ? 'in' : 'cm'})
                      </th>
                      <th style={{ width: '85px', textAlign: 'center', padding: '0.6rem 0.4rem', background: '#0F2744' }}>
                        Height ({formData.unitType === 'inches' ? 'in' : 'cm'})
                      </th>
                      <th style={{ width: '90px', textAlign: 'center', padding: '0.6rem 0.4rem' }}>
                        Weight ({formData.unitType === 'inches' ? 'lbs' : 'kg'})
                      </th>
                      <th style={{ width: '70px', textAlign: 'center', padding: '0.6rem 0.4rem' }}>Pieces</th>
                      <th style={{ width: '85px', textAlign: 'right', padding: '0.6rem 0.5rem', color: '#FBBF24' }}>
                        CFT (Primary)
                      </th>
                      <th style={{ width: '75px', textAlign: 'right', padding: '0.6rem 0.5rem', color: '#38BDF8' }}>
                        CBM
                      </th>
                      <th style={{ width: '40px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map((pkg, idx) => (
                      <tr key={pkg.id || idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#0A192F', padding: '0.5rem' }}>
                          {pkg.id}
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <select
                            className="form-select"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            value={pkg.packageType}
                            onChange={(e) => updatePackageRow(idx, 'packageType', e.target.value)}
                          >
                            <option value="Carton">Carton</option>
                            <option value="Box">Box</option>
                            <option value="Pallet">Pallet</option>
                            <option value="Wooden Crate">Wooden Crate</option>
                            <option value="Skid">Skid</option>
                            <option value="Drum">Drum</option>
                            <option value="Bale">Bale</option>
                            <option value="Bundle">Bundle</option>
                            <option value="Loose Piece">Loose Piece</option>
                          </select>
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <input
                            type="text"
                            className="form-control"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            value={pkg.description}
                            onChange={(e) => updatePackageRow(idx, 'description', e.target.value)}
                            placeholder="e.g. Dry goods, hardware..."
                            required
                          />
                        </td>
                        <td style={{ padding: '0.5rem', background: '#F8FAFC' }}>
                          <input
                            type="number"
                            min="1"
                            step="0.1"
                            placeholder="L"
                            className="form-control"
                            style={{ padding: '0.35rem 0.25rem', fontSize: '0.85rem', textAlign: 'center', fontWeight: 700, borderColor: '#94A3B8' }}
                            value={pkg.lengthInches}
                            onChange={(e) => updatePackageRow(idx, 'lengthInches', e.target.value)}
                            required
                          />
                        </td>
                        <td style={{ padding: '0.5rem', background: '#F8FAFC' }}>
                          <input
                            type="number"
                            min="1"
                            step="0.1"
                            placeholder="W"
                            className="form-control"
                            style={{ padding: '0.35rem 0.25rem', fontSize: '0.85rem', textAlign: 'center', fontWeight: 700, borderColor: '#94A3B8' }}
                            value={pkg.widthInches}
                            onChange={(e) => updatePackageRow(idx, 'widthInches', e.target.value)}
                            required
                          />
                        </td>
                        <td style={{ padding: '0.5rem', background: '#F8FAFC' }}>
                          <input
                            type="number"
                            min="1"
                            step="0.1"
                            placeholder="H"
                            className="form-control"
                            style={{ padding: '0.35rem 0.25rem', fontSize: '0.85rem', textAlign: 'center', fontWeight: 700, borderColor: '#94A3B8' }}
                            value={pkg.heightInches}
                            onChange={(e) => updatePackageRow(idx, 'heightInches', e.target.value)}
                            required
                          />
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <input
                            type="number"
                            min="1"
                            step="0.1"
                            placeholder="LBS"
                            className="form-control"
                            style={{ padding: '0.35rem 0.25rem', fontSize: '0.85rem', textAlign: 'center', fontWeight: 700 }}
                            value={pkg.weightLbs}
                            onChange={(e) => updatePackageRow(idx, 'weightLbs', e.target.value)}
                            required
                          />
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <input
                            type="number"
                            min="1"
                            className="form-control"
                            style={{ padding: '0.35rem 0.25rem', fontSize: '0.85rem', textAlign: 'center', fontWeight: 800, color: '#0284C7' }}
                            value={pkg.pieces}
                            onChange={(e) => updatePackageRow(idx, 'pieces', e.target.value)}
                            required
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#D97706', padding: '0.5rem' }}>
                          {pkg.cft} <span style={{ fontSize: '0.7rem' }}>CFT</span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0284C7', padding: '0.5rem' }}>
                          {pkg.cbm} <span style={{ fontSize: '0.7rem' }}>CBM</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => removePackageRow(idx)}
                            disabled={packages.length <= 1}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.2rem', color: packages.length <= 1 ? '#CBD5E1' : '#EF4444' }}
                            title="Remove package"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Package Row Button & Formulas */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={addPackageRow}
                  className="btn btn-outline btn-sm"
                  style={{ background: '#FFFFFF', borderColor: '#0284C7', color: '#0284C7', fontWeight: 700 }}
                >
                  <Plus size={15} />
                  <span>Add Another Package Row</span>
                </button>

                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                  ✓ Live Automatic Volume Calculation (CFT &amp; CBM)
                </div>
              </div>

              {/* 3. Live Aggregated Totals Bar (CFT IS PRIMARY + Volumetric Weight) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginTop: '1.25rem', background: '#0A192F', color: '#FFFFFF', padding: '1.1rem', borderRadius: '8px', textAlign: 'center' }} className="grid-cols-5-mobile">
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL PIECES</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#38BDF8' }}>{totals.totalPieces}</div>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{packages.length} type(s)</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>ACTUAL WEIGHT</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFFFFF' }}>{totals.totalWeightLbs.toLocaleString()} <span style={{ fontSize: '0.8rem' }}>lbs</span></div>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>({totalWeightKg.toLocaleString()} kg)</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#FBBF24', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL CFT (PRIMARY)</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FBBF24' }}>{roundedCft} <span style={{ fontSize: '0.8rem' }}>CFT</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase' }}>TOTAL CBM (SECONDARY)</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#38BDF8' }}>{roundedCbm} <span style={{ fontSize: '0.8rem' }}>CBM</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#A7F3D0', fontWeight: 800, textTransform: 'uppercase' }}>VOLUMETRIC WEIGHT</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#34D399' }}>{volumetricWeightLbs} <span style={{ fontSize: '0.8rem' }}>lbs</span></div>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>({volumetricWeightKg} kg)</div>
                </div>
              </div>
            </div>

            {/* Section 3: Handling Flags & Notes */}
            <div>
              <h3 style={{ fontSize: '1rem', color: '#0A192F', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={18} style={{ color: '#0284C7' }} />
                <span>3. Special Handling &amp; Receiving Remarks</span>
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label">Cargo Flags</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginTop: '0.2rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={formData.fragile}
                        onChange={(e) => handleInputChange('fragile', e.target.checked)}
                      />
                      <span>Fragile Goods</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={formData.hazardous}
                        onChange={(e) => handleInputChange('hazardous', e.target.checked)}
                      />
                      <span>HAZMAT / Dangerous Goods</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Receiving Notes &amp; Cargo Inspection Remarks</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Optional receiving comments, outer carton condition on arrival..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => onNavigate('warehouse-receipts')}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                <Check size={16} />
                <span>Save &amp; Generate Warehouse Receipt</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Document Card Preview (4 cols) */}
        <div style={{ gridColumn: 'span 4' }} className="col-span-4-mobile">
          <div className="card" style={{ position: 'sticky', top: 'calc(var(--header-height) + 1rem)' }}>
            <div className="card-header" style={{ background: '#0A192F', color: '#FFFFFF' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Live Receipt Preview</div>
              <span style={{ fontSize: '0.7rem', background: '#D97706', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>Draft</span>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748B' }}>Receipt Number:</span>
                <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: '#D97706' }}>{formData.receiptNumber}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748B' }}>Consignee:</span>
                <strong style={{ textAlign: 'right' }}>
                  {formData.customer || (formData.consignee ? formData.consignee.split('\n')[0] : '—')}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748B' }}>Destination Port:</span>
                <strong style={{ color: '#0284C7' }}>{formData.destinationPort}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748B' }}>Staging Location:</span>
                <strong style={{ color: '#059669' }}>{formData.warehouseLocation}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748B' }}>Total Pieces:</span>
                <strong style={{ color: '#0284C7' }}>{totals.totalPieces} Pieces ({packages.length} lines)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748B' }}>Total Volume (CFT):</span>
                <strong style={{ color: '#D97706', fontSize: '0.9rem' }}>{roundedCft} CFT ({roundedCbm} CBM)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748B' }}>Volumetric Weight:</span>
                <strong style={{ color: '#16A34A' }}>{volumetricWeightLbs} lbs ({volumetricWeightKg} kg)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#64748B' }}>Actual Gross Weight:</span>
                <strong>{totals.totalWeightLbs.toLocaleString()} lbs ({totalWeightKg.toLocaleString()} kg)</strong>
              </div>

              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <BarcodeVisual value={formData.receiptNumber} height={35} showText={true} />
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Customer Modal for Quick Creation */}
      <CustomerModal
        isOpen={showAddCustomerModal}
        isEdit={false}
        onClose={() => setShowAddCustomerModal(false)}
        onSave={async (customerData) => {
          const created = await createCustomer(customerData);
          setShowAddCustomerModal(false);
          if (customerCreationTarget === 'shipper') {
            handleShipperSelect(created.id);
          } else {
            handleConsigneeSelect(created.id);
          }
        }}
      />
    </div>
  );
};
