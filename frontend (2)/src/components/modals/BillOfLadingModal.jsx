import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FileText, X, Save, Plus, Layers, CheckSquare, Square, Box, Anchor, Check } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';

export const BillOfLadingModal = ({
  isOpen,
  onClose,
  onSave,
  bl = null,
  isEdit = false,
  initialConsolidationNumber = null
}) => {
  const { ports, customers = [], consolidations = [], houseBills = [], vessels = [] } = useAppData();
  const { currentUser, isAgent } = useAuth();
  const hasInitializedRef = useRef(false);

  const getPortCode = (p) => p?.portCode || p?.code || '';

  const getPolDefault = () => {
    const p = ports.find(pt => getPortCode(pt) === 'MIA' || getPortCode(pt) === 'USMIA');
    return p ? `${getPortCode(p)} - ${p.name}` : (ports[0] ? `${getPortCode(ports[0])} - ${ports[0].name}` : 'MIA - Port of Miami');
  };

  const getPodDefault = () => {
    const targetCode = isAgent ? currentUser?.destinationPortCode : null;
    const p = targetCode ? ports.find(pt => getPortCode(pt) === targetCode) : (ports[0] || null);
    return p ? `${getPortCode(p)} - ${p.name}` : '';
  };

  const [selectedConsolidationNumber, setSelectedConsolidationNumber] = useState('');
  const [selectedHouseBillIds, setSelectedHouseBillIds] = useState([]);

  const [formData, setFormData] = useState({
    blNumber: '',
    issueDate: '',
    shipperId: '',
    shipperName: '',
    shipperAddress: '',
    consigneeId: '',
    consigneeName: '',
    consigneeAddress: '',
    notifyPartyName: '',
    notifyPartyAddress: '',
    oceanVessel: '',
    carrier: '',
    portOfLoading: '',
    portOfDischarge: '',
    containerNumber: '',
    sealNumber: 'BOLT-99281',
    cargoDescription: 'General Consignment: Commercial goods, packaged merchandise and freight.',
    packageCount: 0,
    packageType: 'Packages',
    grossWeightLbs: 0,
    cbm: 0,
    freightTerms: 'Freight Prepaid',
    status: 'Draft'
  });

  // Calculate candidate house bills based on selected consolidation or destination
  const candidateHouseBills = useMemo(() => {
    if (!selectedConsolidationNumber) {
      // If no consolidation is selected, show unassigned house bills matching destination
      const pod = formData.portOfDischarge?.toLowerCase() || '';
      return houseBills.filter(hb => {
        if (bl && (bl.houseBillIds?.includes(hb.hblNumber) || bl.houseBillIds?.includes(hb.id))) return true;
        if (hb.assignedMasterBLId && hb.assignedMasterBLId !== bl?.blNumber && hb.assignedMasterBLId !== bl?.id) return false;
        if (!pod) return true;
        const hbDest = (hb.destinationPort || '').toLowerCase();
        return hbDest.includes(pod.split(' - ')[0]) || hbDest.includes(pod.split(' - ')[1] || pod);
      });
    }

    const consol = consolidations.find(c => c.consolidationNumber === selectedConsolidationNumber || c.id === selectedConsolidationNumber);
    if (!consol) return [];

    return houseBills.filter(hb => {
      // 1. Explicitly assigned to this consolidation
      const matchConsol = hb.assignedConsolidationId === consol.consolidationNumber ||
        hb.assignedConsolidationId === consol.id ||
        (Array.isArray(consol.houseBillIds) && (consol.houseBillIds.includes(hb.hblNumber) || consol.houseBillIds.includes(hb.id)));
      if (matchConsol) return true;

      // 2. Already linked to this Master B/L
      if (bl && (bl.houseBillIds?.includes(hb.hblNumber) || bl.houseBillIds?.includes(hb.id))) return true;

      // 3. Or unassigned House Bills with matching destination
      const isUnassigned = !hb.assignedMasterBLId || hb.assignedMasterBLId === bl?.blNumber || hb.assignedMasterBLId === bl?.id;
      const matchPort = consol.destinationCode && (hb.destinationCode === consol.destinationCode || hb.destinationPort?.includes(consol.destinationCode));
      return isUnassigned && matchPort;
    });
  }, [selectedConsolidationNumber, consolidations, houseBills, formData.portOfDischarge, bl]);

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const pol = getPolDefault();
    const pod = getPodDefault();

    if (bl && isEdit) {
      const linkedHblNums = bl.houseBillIds || [];
      setSelectedHouseBillIds(linkedHblNums);
      setSelectedConsolidationNumber(bl.consolidationNumber || bl.consolidationId || '');

      setFormData({
        blNumber: bl.blNumber || '',
        issueDate: bl.issueDate || bl.createdDate || new Date().toISOString().split('T')[0],
        shipperId: bl.shipperId || (typeof bl.shipper === 'object' ? bl.shipper?.id : '') || '',
        shipperName: bl.shipper?.name || 'KERS Global Freight Forwarding Inc.',
        shipperAddress: bl.shipper?.address || '8200 NW 33rd Street, Miami, FL 33122 USA',
        consigneeId: bl.consigneeId || (typeof bl.consignee === 'object' ? bl.consignee?.id : '') || '',
        consigneeName: bl.consignee?.name || '',
        consigneeAddress: bl.consignee?.address || '',
        notifyPartyName: bl.notifyParty?.name || '',
        notifyPartyAddress: bl.notifyParty?.address || '',
        oceanVessel: bl.oceanVessel || 'M/V Caribbean Carrier',
        carrier: bl.carrier || 'Tropical Shipping',
        portOfLoading: bl.portOfLoading || pol,
        portOfDischarge: bl.portOfDischarge || pod,
        containerNumber: bl.containerNumber || '',
        sealNumber: bl.sealNumber || 'BOLT-99281',
        cargoDescription: bl.cargoDescription || 'General Consignment',
        packageCount: bl.packageCount || 0,
        packageType: bl.packageType || 'Packages',
        grossWeightLbs: bl.grossWeightLbs || 0,
        cbm: bl.cbm || 0,
        freightTerms: bl.freightTerms || 'Freight Prepaid',
        status: bl.status || 'Draft'
      });
    } else {
      const initConsolNum = initialConsolidationNumber || '';
      setSelectedConsolidationNumber(initConsolNum);

      const generatedBlNumber = `BL-VI-2026-${Math.floor(100 + Math.random() * 899)}`;
      let initialVessel = '';
      let initialCarrier = 'Tropical Shipping';
      let initialPod = pod;
      let initialContainer = '';
      let initialSeal = '';
      let initialConsignee = '';
      let initialHblIds = [];

      if (initConsolNum) {
        const found = consolidations.find(c => c.consolidationNumber === initConsolNum || c.id === initConsolNum);
        if (found) {
          initialVessel = found.vesselName || '';
          initialCarrier = found.carrier || 'Tropical Shipping';
          initialPod = found.destinationPort || found.dischargePort || pod;
          initialContainer = found.containerNumber || '';
          initialSeal = found.sealNumber || '';
          initialConsignee = found.agentName ? `${found.agentName} (Destination Agent)` : 'To Order of Destination Agent';

          // Gather HBLs linked to this consolidation
          const linkedHbls = houseBills.filter(h =>
            h.assignedConsolidationId === found.consolidationNumber ||
            h.assignedConsolidationId === found.id ||
            found.houseBillIds?.includes(h.hblNumber) ||
            found.houseBillIds?.includes(h.id)
          );
          initialHblIds = linkedHbls.map(h => h.hblNumber || h.id);
        }
      }

      setSelectedHouseBillIds(initialHblIds);

      setFormData({
        blNumber: generatedBlNumber,
        issueDate: new Date().toISOString().split('T')[0],
        shipperName: 'VI Customs Brokers & Logistics',
        shipperAddress: '1200 NW 78th Ave, Miami, FL 33126',
        consigneeName: initialConsignee,
        consigneeAddress: initialPod,
        notifyPartyName: 'Same as Consignee',
        notifyPartyAddress: initialPod,
        oceanVessel: initialVessel,
        carrier: initialCarrier,
        portOfLoading: pol,
        portOfDischarge: initialPod,
        containerNumber: initialContainer,
        sealNumber: initialSeal,
        cargoDescription: 'General Consignment: Consolidated ocean freight merchandise.',
        packageCount: 0,
        packageType: 'Packages',
        grossWeightLbs: 0,
        cbm: 0,
        freightTerms: 'Freight Prepaid',
        status: 'Draft'
      });
    }
  }, [isOpen, bl, isEdit, initialConsolidationNumber, consolidations, houseBills]);

  // Handle Consolidation dropdown selection
  const handleConsolidationSelect = (consolNum) => {
    setSelectedConsolidationNumber(consolNum);

    if (!consolNum) {
      return;
    }

    const selectedConsol = consolidations.find(c => c.consolidationNumber === consolNum || c.id === consolNum);
    if (!selectedConsol) return;

    // Load House B/Ls linked to this consolidation
    const matchedHbls = houseBills.filter(hb =>
      hb.assignedConsolidationId === selectedConsol.consolidationNumber ||
      hb.assignedConsolidationId === selectedConsol.id ||
      (Array.isArray(selectedConsol.houseBillIds) && (selectedConsol.houseBillIds.includes(hb.hblNumber) || selectedConsol.houseBillIds.includes(hb.id)))
    );

    const targetHbls = matchedHbls.length > 0 ? matchedHbls : houseBills.filter(hb =>
      !hb.assignedMasterBLId && selectedConsol.destinationCode && (hb.destinationCode === selectedConsol.destinationCode || hb.destinationPort?.includes(selectedConsol.destinationCode))
    );

    const hblIds = targetHbls.map(h => h.hblNumber || h.id);
    setSelectedHouseBillIds(hblIds);

    // Sum totals from candidate HBLs
    let sumPkgs = 0;
    let sumWeightLbs = 0;
    let sumCbm = 0;

    targetHbls.forEach(h => {
      sumPkgs += Number(h.totalPackages || h.packageCount || 1);
      sumWeightLbs += Number(h.totalWeightLbs || 0);
      sumCbm += Number(h.totalCbm || 0);
    });

    if (sumPkgs === 0 && selectedConsol.totalPackages) sumPkgs = Number(selectedConsol.totalPackages);
    if (sumWeightLbs === 0 && selectedConsol.totalWeightLbs) sumWeightLbs = Number(selectedConsol.totalWeightLbs);
    if (sumCbm === 0 && selectedConsol.totalCbm) sumCbm = Number(selectedConsol.totalCbm);

    const destPortName = selectedConsol.destinationPort || selectedConsol.dischargePort || formData.portOfDischarge;

    setFormData(prev => ({
      ...prev,
      oceanVessel: selectedConsol.vesselName || prev.oceanVessel,
      carrier: selectedConsol.carrier || prev.carrier,
      portOfDischarge: destPortName,
      consigneeName: prev.consigneeName || (selectedConsol.agentName ? `${selectedConsol.agentName} (Destination Agent)` : 'To Order of Destination Agent'),
      consigneeAddress: prev.consigneeAddress || destPortName,
      notifyPartyName: prev.notifyPartyName || selectedConsol.agentName || 'Same as Consignee',
      notifyPartyAddress: prev.notifyPartyAddress || destPortName,
      containerNumber: selectedConsol.containerNumber || prev.containerNumber,
      sealNumber: selectedConsol.sealNumber || prev.sealNumber,
      packageCount: sumPkgs,
      grossWeightLbs: Math.round(sumWeightLbs),
      cbm: Number(sumCbm.toFixed(2)),
      cargoDescription: targetHbls.length > 0
        ? `Consolidation of ${targetHbls.length} House B/Ls (${sumPkgs} Packages): Commercial goods and cargo consigned for ${destPortName}.`
        : `Consolidation ${selectedConsol.consolidationNumber}: Commercial goods and ocean freight.`
    }));
  };

  // Toggle individual House B/L selection
  const toggleHouseBill = (hblNumber) => {
    setSelectedHouseBillIds(prev => {
      const isSelected = prev.includes(hblNumber);
      const updated = isSelected ? prev.filter(id => id !== hblNumber) : [...prev, hblNumber];

      // Recalculate totals based on updated selection
      const activeHbls = candidateHouseBills.filter(h => updated.includes(h.hblNumber || h.id));
      let sumPkgs = 0;
      let sumWeightLbs = 0;
      let sumCbm = 0;

      activeHbls.forEach(h => {
        sumPkgs += Number(h.totalPackages || h.packageCount || 1);
        sumWeightLbs += Number(h.totalWeightLbs || 0);
        sumCbm += Number(h.totalCbm || 0);
      });

      setFormData(f => ({
        ...f,
        packageCount: sumPkgs,
        grossWeightLbs: Math.round(sumWeightLbs),
        cbm: Number(sumCbm.toFixed(2)),
        cargoDescription: activeHbls.length > 0
          ? `Consolidation of ${activeHbls.length} House B/Ls (${sumPkgs} Packages): Commercial goods and cargo consigned for ${f.portOfDischarge}.`
          : f.cargoDescription
      }));

      return updated;
    });
  };

  const selectAllHouseBills = () => {
    const allIds = candidateHouseBills.map(h => h.hblNumber || h.id);
    setSelectedHouseBillIds(allIds);

    let sumPkgs = 0;
    let sumWeightLbs = 0;
    let sumCbm = 0;

    candidateHouseBills.forEach(h => {
      sumPkgs += Number(h.totalPackages || h.packageCount || 1);
      sumWeightLbs += Number(h.totalWeightLbs || 0);
      sumCbm += Number(h.totalCbm || 0);
    });

    setFormData(prev => ({
      ...prev,
      packageCount: sumPkgs,
      grossWeightLbs: Math.round(sumWeightLbs),
      cbm: Number(sumCbm.toFixed(2)),
      cargoDescription: candidateHouseBills.length > 0
        ? `Consolidation of ${candidateHouseBills.length} House B/Ls (${sumPkgs} Packages): Commercial goods and cargo consigned for ${prev.portOfDischarge}.`
        : prev.cargoDescription
    }));
  };

  const clearAllHouseBills = () => {
    setSelectedHouseBillIds([]);
    setFormData(prev => ({
      ...prev,
      packageCount: 0,
      grossWeightLbs: 0,
      cbm: 0
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedConsol = consolidations.find(c => c.consolidationNumber === selectedConsolidationNumber || c.id === selectedConsolidationNumber);

    onSave({
      blNumber: formData.blNumber,
      issueDate: formData.issueDate,
      consolidationId: selectedConsol?.id || null,
      consolidationNumber: selectedConsolidationNumber || null,
      houseBillIds: selectedHouseBillIds,
      agentId: bl?.agentId || currentUser?.agentId || null,
      agentName: bl?.agentName || (currentUser?.roleKey === 'agent' ? currentUser.name : ''),
      destinationPortCode: formData.portOfDischarge?.split(' - ')[0]?.trim() || '',
      shipperId: formData.shipperId || undefined,
      consigneeId: formData.consigneeId || undefined,
      shipper: {
        id: formData.shipperId || undefined,
        name: formData.shipperName,
        address: formData.shipperAddress
      },
      consignee: {
        id: formData.consigneeId || undefined,
        name: formData.consigneeName,
        address: formData.consigneeAddress
      },
      notifyParty: {
        name: formData.notifyPartyName,
        address: formData.notifyPartyAddress
      },
      oceanVessel: formData.oceanVessel,
      carrier: formData.carrier,
      portOfLoading: formData.portOfLoading,
      portOfDischarge: formData.portOfDischarge,
      containerNumber: formData.containerNumber,
      sealNumber: formData.sealNumber,
      cargoDescription: formData.cargoDescription,
      packageCount: Number(formData.packageCount) || 0,
      totalPieces: Number(formData.packageCount) || 0,
      packageType: formData.packageType,
      grossWeightLbs: Number(formData.grossWeightLbs) || 0,
      grossWeightKg: Number(((Number(formData.grossWeightLbs) || 0) * 0.453592).toFixed(1)),
      cbm: Number(formData.cbm) || 0,
      cft: Number(((Number(formData.cbm) || 0) * 35.3147).toFixed(1)),
      freightTerms: formData.freightTerms,
      status: formData.status
    });
    onClose();
  };

  const selectedConsolObj = consolidations.find(c => c.consolidationNumber === selectedConsolidationNumber || c.id === selectedConsolidationNumber);

  return (
    <div className="modal-backdrop">
      <div
        className="modal-dialog modal-xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95vw',
          maxWidth: '980px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <div className="modal-header" style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
          <div className="modal-title">
            <FileText size={20} style={{ color: '#0A192F' }} />
            <span>{isEdit ? `Edit Master Bill of Lading ${formData.blNumber}` : 'Create Master Bill of Lading (B/L)'}</span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault();
            }
          }}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
        >
          <div className="modal-body custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1, minHeight: 0, padding: '1.25rem' }}>
            
            {/* STEP 1: Consolidation Link & Auto-Population Banner */}
            <div style={{
              background: '#F0F9FF',
              border: '1.5px solid #0284C7',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#0284C7', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={15} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0A192F', fontWeight: 700 }}>
                      Step 1: Select Consolidation Number (Recommended)
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                      Select an existing Consolidation. All linked House B/Ls, vessel, carrier, container, and cargo metrics will load automatically.
                    </p>
                  </div>
                </div>

                {selectedConsolObj && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1', background: '#E0F2FE', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                    Linked: {selectedConsolObj.consolidationNumber} ({selectedConsolObj.destinationPort || 'Consolidation'})
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Consolidation #</label>
                  <select
                    className="form-select"
                    value={selectedConsolidationNumber}
                    onChange={(e) => handleConsolidationSelect(e.target.value)}
                  >
                    <option value="">-- None (Direct / Standalone Master B/L) --</option>
                    {consolidations.map(c => (
                      <option key={c.id || c.consolidationNumber} value={c.consolidationNumber}>
                        {c.consolidationNumber} — {c.title || c.destinationPort} ({c.vesselName || 'Vessel'} • {c.containerNumber || 'Box'} • {c.totalHouseBills || c.houseBillIds?.length || 0} HBLs)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#475569', background: '#FFFFFF', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #BAE6FD' }}>
                  {selectedConsolObj ? (
                    <div>
                      <strong>{selectedConsolObj.vesselName || 'Ocean Vessel'}</strong> • Container: <strong>{selectedConsolObj.containerNumber || 'TBD'}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#0284C7', marginTop: '2px' }}>
                        Discharge Port: {selectedConsolObj.destinationPort} • Seal: {selectedConsolObj.sealNumber || 'N/A'}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: '#64748B' }}>
                      Tip: Select a consolidation to automatically load its House Bills and fill in container and vessel details.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 2: Interactive House B/Ls Linked Table */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Box size={16} style={{ color: '#0284C7' }} />
                  <span style={{ fontWeight: 700, color: '#0A192F', fontSize: '0.9rem' }}>
                    Linked House Bills of Lading ({selectedHouseBillIds.length} of {candidateHouseBills.length} selected)
                  </span>
                </div>

                {candidateHouseBills.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={selectAllHouseBills}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAllHouseBills}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: '#64748B' }}
                    >
                      Deselect All
                    </button>
                  </div>
                )}
              </div>

              {candidateHouseBills.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '6px', color: '#64748B', fontSize: '0.825rem' }}>
                  No House B/Ls currently match this consolidation or port of discharge. You can enter cargo totals manually below or link House B/Ls later.
                </div>
              ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem 0.75rem', width: '36px' }}></th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>HBL Number</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Consignee</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Packages</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Weight (LBS)</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Volume</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Destination</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidateHouseBills.map(h => {
                        const isChecked = selectedHouseBillIds.includes(h.hblNumber) || selectedHouseBillIds.includes(h.id);
                        const cftVal = h.totalCft || (h.totalCbm ? Number((h.totalCbm * 35.3147).toFixed(1)) : 0);
                        return (
                          <tr
                            key={h.id || h.hblNumber}
                            onClick={() => toggleHouseBill(h.hblNumber || h.id)}
                            style={{
                              borderBottom: '1px solid #F1F5F9',
                              background: isChecked ? '#F0FDF4' : '#FFFFFF',
                              cursor: 'pointer'
                            }}
                          >
                            <td style={{ padding: '0.45rem 0.75rem' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // handled by row onClick
                                style={{ cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '0.45rem 0.75rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#0A192F' }}>
                              {h.hblNumber}
                            </td>
                            <td style={{ padding: '0.45rem 0.75rem', color: '#1E293B' }}>
                              {h.consignee?.name || h.consignee || 'Consignee'}
                            </td>
                            <td style={{ padding: '0.45rem 0.75rem', fontWeight: 600 }}>
                              {h.totalPackages || h.packageCount || 1} pkgs
                            </td>
                            <td style={{ padding: '0.45rem 0.75rem' }}>
                              {h.totalWeightLbs ? `${Number(h.totalWeightLbs).toLocaleString()} lbs` : '—'}
                            </td>
                            <td style={{ padding: '0.45rem 0.75rem', color: '#D97706', fontWeight: 600 }}>
                              {cftVal} CFT ({h.totalCbm || 0} CBM)
                            </td>
                            <td style={{ padding: '0.45rem 0.75rem', color: '#0284C7' }}>
                              {h.destinationPort || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* B/L Number and Issue Date */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Master B/L Number <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  disabled={isEdit}
                  className="form-control"
                  value={formData.blNumber}
                  onChange={(e) => setFormData({ ...formData, blNumber: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Issue Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                />
              </div>
            </div>

            {/* Shipper & Consignee */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                  Shipper / Forwarder Details
                </span>
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <label className="form-label" style={{ margin: 0, fontSize: '0.75rem' }}>Shipper Name</label>
                    <select
                      style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', maxWidth: '170px' }}
                      defaultValue=""
                      onChange={(e) => {
                        const c = customers.find(cust => cust.id === e.target.value);
                        if (c) {
                          setFormData(prev => ({
                            ...prev,
                            shipperId: c.id,
                            shipperName: c.name,
                            shipperAddress: c.address || prev.shipperAddress
                          }));
                        }
                      }}
                    >
                      <option value="" disabled>From Customers...</option>
                      {customers.map(c => (
                        <option key={`bl-m-shipper-${c.id}`} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.shipperName}
                    onChange={(e) => setFormData({ ...formData, shipperName: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Shipper Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.shipperAddress}
                    onChange={(e) => setFormData({ ...formData, shipperAddress: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                  Consignee Details <span className="required">*</span>
                </span>
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <label className="form-label" style={{ margin: 0, fontSize: '0.75rem' }}>Consignee Name</label>
                    <select
                      style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', maxWidth: '170px' }}
                      defaultValue=""
                      onChange={(e) => {
                        const c = customers.find(cust => cust.id === e.target.value);
                        if (c) {
                          setFormData(prev => ({
                            ...prev,
                            consigneeId: c.id,
                            consigneeName: c.name,
                            consigneeAddress: c.address || prev.consigneeAddress
                          }));
                        }
                      }}
                    >
                      <option value="" disabled>From Customers...</option>
                      {customers.map(c => (
                        <option key={`bl-m-consignee-${c.id}`} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Caribbean Distribution Ltd"
                    value={formData.consigneeName}
                    onChange={(e) => setFormData({ ...formData, consigneeName: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Consignee Address</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Port Road, Port of Discharge"
                    value={formData.consigneeAddress}
                    onChange={(e) => setFormData({ ...formData, consigneeAddress: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Ocean Vessel & Carrier */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Ocean Vessel</label>
                  {vessels && vessels.length > 0 && (
                    <select
                      style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', maxWidth: '170px' }}
                      defaultValue=""
                      onChange={(e) => {
                        const v = vessels.find(ves => ves.id === e.target.value || ves.name === e.target.value);
                        if (v) {
                          setFormData(prev => ({
                            ...prev,
                            oceanVessel: v.name,
                            carrier: v.carrier || prev.carrier
                          }));
                        }
                      }}
                    >
                      <option value="" disabled>From Fleet...</option>
                      {vessels.map(v => (
                        <option key={`mbl-ves-${v.id || v.name}`} value={v.id || v.name}>{v.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. M/V Island Trader"
                  value={formData.oceanVessel}
                  onChange={(e) => setFormData({ ...formData, oceanVessel: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Carrier</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Tropical Shipping"
                  value={formData.carrier}
                  onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                />
              </div>
            </div>

            {/* Routing Ports */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Port of Loading (POL)</label>
                <select
                  className="form-select"
                  value={formData.portOfLoading}
                  onChange={(e) => setFormData({ ...formData, portOfLoading: e.target.value })}
                >
                  {formData.portOfLoading && !ports.some(p => `${getPortCode(p)} - ${p.name}` === formData.portOfLoading) && (
                    <option value={formData.portOfLoading}>{formData.portOfLoading}</option>
                  )}
                  {ports.map(p => {
                    const pCode = getPortCode(p);
                    return (
                      <option key={`pol-${p.id || pCode}`} value={`${pCode} - ${p.name}`}>
                        {pCode} — {p.name} ({p.island || p.country || 'Port'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Port of Discharge (POD) <span className="required">*</span></label>
                <select
                  className="form-select"
                  value={formData.portOfDischarge}
                  onChange={(e) => setFormData({ ...formData, portOfDischarge: e.target.value })}
                  required
                >
                  {formData.portOfDischarge && !ports.some(p => `${getPortCode(p)} - ${p.name}` === formData.portOfDischarge) && (
                    <option value={formData.portOfDischarge}>{formData.portOfDischarge}</option>
                  )}
                  {ports.map(p => {
                    const pCode = getPortCode(p);
                    return (
                      <option key={`pod-${p.id || pCode}`} value={`${pCode} - ${p.name}`}>
                        {pCode} — {p.name} ({p.island || p.country || 'Port'})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Container & Seal */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Container Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. MSKU-829104-5"
                  value={formData.containerNumber}
                  onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Bolt Seal Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. SEAL-VI-8821"
                  value={formData.sealNumber}
                  onChange={(e) => setFormData({ ...formData, sealNumber: e.target.value })}
                />
              </div>
            </div>

            {/* Cargo Description */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cargo Description <span className="required">*</span></label>
              <textarea
                required
                className="form-control"
                rows={2}
                value={formData.cargoDescription}
                onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
              />
            </div>

            {/* Package, Weight & Volume Totals (Auto-aggregated) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Total Packages</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={formData.packageCount}
                  onChange={(e) => setFormData({ ...formData, packageCount: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Gross Weight (LBS)</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={formData.grossWeightLbs}
                  onChange={(e) => setFormData({ ...formData, grossWeightLbs: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Volume (CBM)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={formData.cbm}
                  onChange={(e) => setFormData({ ...formData, cbm: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">B/L Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Draft">Draft</option>
                  <option value="Released">Released</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div
            className="modal-footer"
            style={{
              flexShrink: 0,
              padding: '0.85rem 1.5rem',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isEdit ? <Save size={14} /> : <Plus size={14} />}
              <span>{isEdit ? 'Save B/L Changes' : 'Issue Master B/L'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
