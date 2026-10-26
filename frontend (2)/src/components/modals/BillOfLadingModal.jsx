import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FileText, X, Save, Plus, Layers, Box } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';

export const BillOfLadingModal = ({
  isOpen,
  onClose,
  onSave,
  bl = null,
  isEdit = false,
  initialConsolidationNumber = null,
  initialShipment = null
}) => {
  const { ports = [], consolidations = [], houseBills = [], vessels = [] } = useAppData();
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

  // Calculate candidate house bills based on entered consolidation or destination
  const candidateHouseBills = useMemo(() => {
    if (!selectedConsolidationNumber) {
      // If no consolidation is entered, show unassigned house bills matching destination
      const pod = formData.portOfDischarge?.toLowerCase() || '';
      return houseBills.filter(hb => {
        if (bl && (bl.houseBillIds?.includes(hb.hblNumber) || bl.houseBillIds?.includes(hb.id))) return true;
        if (hb.assignedMasterBLId && hb.assignedMasterBLId !== bl?.blNumber && hb.assignedMasterBLId !== bl?.id) return false;
        if (!pod) return true;
        const hbDest = (hb.destinationPort || '').toLowerCase();
        return hbDest.includes(pod.split(' - ')[0]) || hbDest.includes(pod.split(' - ')[1] || pod);
      });
    }

    const trimmed = selectedConsolidationNumber.trim().toLowerCase();

    // 1. Check direct HBL matches tagged with this company consolidation number
    const directHbls = houseBills.filter(hb =>
      hb.assignedConsolidationId && hb.assignedConsolidationId.trim().toLowerCase() === trimmed
    );
    if (directHbls.length > 0) {
      return directHbls;
    }

    const consol = consolidations.find(c =>
      (c.consolidationNumber && c.consolidationNumber.toLowerCase() === trimmed) ||
      (c.id && String(c.id).toLowerCase() === trimmed)
    );
    if (!consol) {
      return houseBills.filter(hb => {
        if (bl && (bl.houseBillIds?.includes(hb.hblNumber) || bl.houseBillIds?.includes(hb.id))) return true;
        return !hb.assignedMasterBLId || hb.assignedMasterBLId === bl?.blNumber;
      });
    }

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

  // Unified list of all Consolidation Numbers across both HBLs and Consolidations
  const allConsolidationNumbers = useMemo(() => {
    const set = new Set();
    consolidations.forEach(c => {
      if (c.consolidationNumber) set.add(c.consolidationNumber.trim());
    });
    houseBills.forEach(h => {
      if (h.assignedConsolidationId) set.add(h.assignedConsolidationId.trim());
    });
    return Array.from(set);
  }, [consolidations, houseBills]);

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
        shipperName: bl.shipper?.name || 'VI Customs Brokers & Logistics',
        shipperAddress: bl.shipper?.address || '1200 NW 78th Ave, Miami, FL 33126',
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
        cargoDescription: bl.cargoDescription || 'General Consignment: Consolidated ocean freight merchandise.',
        packageCount: bl.packageCount || 0,
        packageType: bl.packageType || 'Packages',
        grossWeightLbs: bl.grossWeightLbs || 0,
        cbm: bl.cbm || 0,
        freightTerms: bl.freightTerms || 'Freight Prepaid',
        status: bl.status || 'Draft'
      });
    } else {
      const initConsolNum = initialShipment?.consolidationId || initialShipment?.consolidationNumber || initialConsolidationNumber || '';
      setSelectedConsolidationNumber(initConsolNum);

      const generatedBlNumber = `BL-VI-2026-${Math.floor(100 + Math.random() * 899)}`;
      let initialVessel = initialShipment?.vesselName || '';
      let initialCarrier = initialShipment?.carrier || 'Tropical Shipping';
      let initialPod = initialShipment?.destinationPort || pod;
      let initialContainer = initialShipment?.containerNumber || '';
      let initialSeal = initialShipment?.sealNumber || '';
      let initialConsignee = initialShipment?.agentName ? `${initialShipment.agentName} (Destination Agent)` : '';
      let initialHblIds = [];
      let initialPackageCount = Number(initialShipment?.totalPackages) || 0;
      let initialGrossWeight = Number(initialShipment?.totalWeightLbs) || 0;
      let initialCbm = Number(initialShipment?.totalCbm) || 0;

      if (initConsolNum) {
        const found = consolidations.find(c => c.consolidationNumber === initConsolNum || c.id === initConsolNum);
        if (found) {
          if (!initialVessel) initialVessel = found.vesselName || '';
          if (!initialCarrier) initialCarrier = found.carrier || 'Tropical Shipping';
          if (!initialPod || initialPod === pod) initialPod = found.destinationPort || found.dischargePort || pod;
          if (!initialContainer) initialContainer = found.containerNumber || '';
          if (!initialSeal) initialSeal = found.sealNumber || '';
          if (!initialConsignee) initialConsignee = found.agentName ? `${found.agentName} (Destination Agent)` : 'To Order of Destination Agent';
          if (!initialPackageCount && found.totalPackages) initialPackageCount = Number(found.totalPackages);
          if (!initialGrossWeight && found.totalWeightLbs) initialGrossWeight = Number(found.totalWeightLbs);
          if (!initialCbm && found.totalCbm) initialCbm = Number(found.totalCbm);

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

      if (!initialConsignee) initialConsignee = 'To Order of Destination Agent';
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
        cargoDescription: `Consolidated ocean freight merchandise for ${initialPod}.`,
        packageCount: initialPackageCount,
        packageType: 'Packages',
        grossWeightLbs: initialGrossWeight,
        cbm: initialCbm,
        freightTerms: 'Freight Prepaid',
        status: 'Draft'
      });
    }
  }, [isOpen, bl, isEdit, initialConsolidationNumber, initialShipment, consolidations, houseBills]);

  // Handle Consolidation text input change
  const handleConsolidationChange = (consolNum) => {
    setSelectedConsolidationNumber(consolNum);

    if (!consolNum) {
      return;
    }

    const trimmed = consolNum.trim().toLowerCase();

    // 1. Check direct HBL matches tagged with this company consolidation number
    const directHbls = houseBills.filter(hb =>
      hb.assignedConsolidationId && hb.assignedConsolidationId.trim().toLowerCase() === trimmed
    );

    // 2. Check consolidation record
    const selectedConsol = consolidations.find(c =>
      (c.consolidationNumber && c.consolidationNumber.toLowerCase() === trimmed) ||
      (c.id && String(c.id).toLowerCase() === trimmed)
    );

    let targetHbls = directHbls;
    if (targetHbls.length === 0 && selectedConsol) {
      const matchedHbls = houseBills.filter(hb =>
        hb.assignedConsolidationId === selectedConsol.consolidationNumber ||
        hb.assignedConsolidationId === selectedConsol.id ||
        (Array.isArray(selectedConsol.houseBillIds) && (selectedConsol.houseBillIds.includes(hb.hblNumber) || selectedConsol.houseBillIds.includes(hb.id)))
      );
      targetHbls = matchedHbls.length > 0 ? matchedHbls : houseBills.filter(hb =>
        !hb.assignedMasterBLId && selectedConsol.destinationCode && (hb.destinationCode === selectedConsol.destinationCode || hb.destinationPort?.includes(selectedConsol.destinationCode))
      );
    }

    if (targetHbls.length > 0) {
      const hblIds = targetHbls.map(h => h.hblNumber || h.id);
      setSelectedHouseBillIds(hblIds);

      let sumPkgs = 0;
      let sumWeightLbs = 0;
      let sumCbm = 0;

      targetHbls.forEach(h => {
        sumPkgs += Number(h.totalPackages || h.packageCount || 1);
        sumWeightLbs += Number(h.totalWeightLbs || 0);
        sumCbm += Number(h.totalCbm || 0);
      });

      const firstHbl = targetHbls[0];
      const destPortName = selectedConsol?.destinationPort || firstHbl?.destinationPort || formData.portOfDischarge;

      setFormData(prev => ({
        ...prev,
        oceanVessel: selectedConsol?.vesselName || prev.oceanVessel,
        carrier: selectedConsol?.carrier || prev.carrier,
        portOfDischarge: destPortName || prev.portOfDischarge,
        consigneeName: prev.consigneeName || (selectedConsol?.agentName ? `${selectedConsol.agentName} (Destination Agent)` : 'To Order of Destination Agent'),
        consigneeAddress: prev.consigneeAddress || destPortName,
        notifyPartyName: prev.notifyPartyName || selectedConsol?.agentName || 'Same as Consignee',
        notifyPartyAddress: prev.notifyPartyAddress || destPortName,
        containerNumber: selectedConsol?.containerNumber || prev.containerNumber,
        sealNumber: selectedConsol?.sealNumber || prev.sealNumber,
        packageCount: sumPkgs,
        grossWeightLbs: Math.round(sumWeightLbs),
        cbm: Number(sumCbm.toFixed(2)),
        cargoDescription: `Consolidation ${consolNum}: ${targetHbls.length} House B/Ls (${sumPkgs} Packages) consigned for ${destPortName || 'Destination'}.`
      }));
    } else if (selectedConsol) {
      const destPortName = selectedConsol.destinationPort || selectedConsol.dischargePort || formData.portOfDischarge;
      setFormData(prev => ({
        ...prev,
        oceanVessel: selectedConsol.vesselName || prev.oceanVessel,
        carrier: selectedConsol.carrier || prev.carrier,
        portOfDischarge: destPortName,
        containerNumber: selectedConsol.containerNumber || prev.containerNumber,
        sealNumber: selectedConsol.sealNumber || prev.sealNumber,
        packageCount: Number(selectedConsol.totalPackages) || 0,
        grossWeightLbs: Math.round(Number(selectedConsol.totalWeightLbs) || 0),
        cbm: Number(Number(selectedConsol.totalCbm || 0).toFixed(2)),
        cargoDescription: `Consolidation ${selectedConsol.consolidationNumber}: Commercial ocean freight.`
      }));
    }
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

    const trimmed = selectedConsolidationNumber ? selectedConsolidationNumber.trim().toLowerCase() : '';
    const selectedConsol = consolidations.find(c =>
      (c.consolidationNumber && c.consolidationNumber.toLowerCase() === trimmed) ||
      (c.id && String(c.id).toLowerCase() === trimmed)
    );

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

  const selectedConsolObj = consolidations.find(c =>
    (c.consolidationNumber && c.consolidationNumber.toLowerCase() === selectedConsolidationNumber?.trim().toLowerCase()) ||
    (c.id && String(c.id).toLowerCase() === selectedConsolidationNumber?.trim().toLowerCase())
  );

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 25, 47, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '1.5rem',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '84vh',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto',
          borderRadius: '12px',
          background: '#FFFFFF',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        <div className="modal-header" style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
          <div className="modal-title">
            <FileText size={18} style={{ color: '#0A192F' }} />
            <span style={{ fontSize: '1rem', fontWeight: 800 }}>{isEdit ? `Edit Master Bill of Lading ${formData.blNumber}` : 'Create Master Bill of Lading (B/L)'}</span>
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
          <div className="modal-body custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', flex: 1, minHeight: 0, padding: '1rem 1.25rem' }}>
            
            {/* Linked Shipment Banner */}
            {initialShipment && (
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🚢</span>
                  <div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#166534' }}>
                      Linked Ocean Shipment: {initialShipment.shipmentNumber}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#15803D' }}>
                      Container: {formData.containerNumber || initialShipment.containerNumber || 'TBD'} • Seal: {formData.sealNumber || initialShipment.sealNumber || 'N/A'} • {formData.packageCount} pkgs • {formData.grossWeightLbs} lbs
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: '#DCFCE7',
                    color: '#166534',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid #86EFAC'
                  }}
                >
                  ✓ Auto-Filled
                </span>
              </div>
            )}

            {/* STEP 1: Consolidation Link & Input */}
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
                      Consolidation Number
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                      Type or paste any Consolidation #. If it matches an existing consolidation, container and vessel details will auto-fill.
                    </p>
                  </div>
                </div>

                {selectedConsolObj && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1', background: '#E0F2FE', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                    Matched: {selectedConsolObj.consolidationNumber} ({selectedConsolObj.destinationPort || 'Consolidation'})
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Consolidation #</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Consolidation # (e.g. CNS-2026-001) or leave empty"
                    value={selectedConsolidationNumber}
                    onChange={(e) => handleConsolidationChange(e.target.value)}
                    list="consolidation-numbers-list"
                  />
                  <datalist id="consolidation-numbers-list">
                    {allConsolidationNumbers.map(cn => (
                      <option key={cn} value={cn}>
                        {cn}
                      </option>
                    ))}
                  </datalist>
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
                      Client can type any Consolidation Number directly, or fill in vessel and container details manually below.
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
                                onChange={() => {}}
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
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Shipper Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. VI Customs Brokers & Logistics"
                    value={formData.shipperName}
                    onChange={(e) => setFormData({ ...formData, shipperName: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Shipper Address</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 1200 NW 78th Ave, Miami, FL 33126"
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
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Consignee Name <span className="required">*</span></label>
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
                <label className="form-label">Ocean Vessel</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. M/V Caribbean Carrier"
                  value={formData.oceanVessel}
                  onChange={(e) => setFormData({ ...formData, oceanVessel: e.target.value })}
                  list="vessels-suggestions-list"
                />
                <datalist id="vessels-suggestions-list">
                  {vessels.map(v => (
                    <option key={`mbl-ves-${v.id || v.name}`} value={v.name} />
                  ))}
                </datalist>
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

            {/* Routing Ports (Input fields) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Port of Loading (POL)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. MIA - Port of Miami"
                  value={formData.portOfLoading}
                  onChange={(e) => setFormData({ ...formData, portOfLoading: e.target.value })}
                  list="pol-suggestions-list"
                />
                <datalist id="pol-suggestions-list">
                  {ports.map(p => {
                    const pCode = getPortCode(p);
                    return (
                      <option key={`pol-${p.id || pCode}`} value={`${pCode} - ${p.name}`} />
                    );
                  })}
                </datalist>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Port of Discharge (POD) <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. STT - Port of Charlotte Amalie"
                  value={formData.portOfDischarge}
                  onChange={(e) => setFormData({ ...formData, portOfDischarge: e.target.value })}
                  list="pod-suggestions-list"
                />
                <datalist id="pod-suggestions-list">
                  {ports.map(p => {
                    const pCode = getPortCode(p);
                    return (
                      <option key={`pod-${p.id || pCode}`} value={`${pCode} - ${p.name}`} />
                    );
                  })}
                </datalist>
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

            {/* Package, Weight & Volume Totals */}
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
                <input
                  type="text"
                  className="form-control"
                  placeholder="Draft"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  list="bl-status-suggestions-list"
                />
                <datalist id="bl-status-suggestions-list">
                  <option value="Draft" />
                  <option value="Released" />
                  <option value="On Hold" />
                  <option value="Cancelled" />
                </datalist>
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
