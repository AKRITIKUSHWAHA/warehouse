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
  const hasInitializedRef = useRef(false);
  const modalBodyRef = useRef(null);

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

  // Unified list of all Consolidation Numbers with aggregate stats across HBLs and Consolidations
  const consolidationOptions = useMemo(() => {
    const map = new Map();

    // 1. Scan consolidations
    consolidations.forEach(c => {
      const num = (c.consolidationNumber || c.id || '').trim();
      if (num && !map.has(num)) {
        const matchingHbls = houseBills.filter(h =>
          (h.assignedConsolidationId && h.assignedConsolidationId.trim().toLowerCase() === num.toLowerCase()) ||
          (Array.isArray(c.houseBillIds) && (c.houseBillIds.includes(h.hblNumber) || c.houseBillIds.includes(h.id)))
        );
        let pkgs = 0;
        let lbs = 0;
        let cbm = 0;
        matchingHbls.forEach(h => {
          pkgs += Number(h.totalPackages || h.packageCount || 1);
          lbs += Number(h.totalWeightLbs || 0);
          cbm += Number(h.totalCbm || 0);
        });

        map.set(num, {
          num,
          destinationPort: c.destinationPort || c.dischargePort || (matchingHbls[0]?.destinationPort) || '',
          vesselName: c.vesselName || '',
          carrier: c.carrier || 'Tropical Shipping',
          containerNumber: c.containerNumber || '',
          sealNumber: c.sealNumber || '',
          agentName: c.agentName || '',
          hblCount: matchingHbls.length,
          totalPackages: pkgs || Number(c.totalPackages) || 0,
          totalWeightLbs: lbs || Number(c.totalWeightLbs) || 0,
          totalCbm: cbm || Number(c.totalCbm) || 0
        });
      }
    });

    // 2. Scan house bills for assignedConsolidationId
    houseBills.forEach(h => {
      const num = (h.assignedConsolidationId || '').trim();
      if (num && !map.has(num)) {
        const matchingHbls = houseBills.filter(hb =>
          hb.assignedConsolidationId && hb.assignedConsolidationId.trim().toLowerCase() === num.toLowerCase()
        );
        let pkgs = 0;
        let lbs = 0;
        let cbm = 0;
        matchingHbls.forEach(hb => {
          pkgs += Number(hb.totalPackages || hb.packageCount || 1);
          lbs += Number(hb.totalWeightLbs || 0);
          cbm += Number(hb.totalCbm || 0);
        });

        map.set(num, {
          num,
          destinationPort: h.destinationPort || '',
          vesselName: '',
          carrier: 'Tropical Shipping',
          containerNumber: '',
          sealNumber: '',
          agentName: '',
          hblCount: matchingHbls.length,
          totalPackages: pkgs,
          totalWeightLbs: lbs,
          totalCbm: cbm
        });
      }
    });

    return Array.from(map.values());
  }, [consolidations, houseBills]);

  const allConsolidationNumbers = useMemo(() => {
    return consolidationOptions.map(c => c.num);
  }, [consolidationOptions]);

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
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
        shipperName: (typeof bl.shipper === 'object' ? bl.shipper?.name : bl.shipper) || 'VI Customs Brokers & Logistics',
        shipperAddress: (typeof bl.shipper === 'object' ? bl.shipper?.address : '') || '1200 NW 78th Ave, Miami, FL 33126',
        consigneeId: bl.consigneeId || (typeof bl.consignee === 'object' ? bl.consignee?.id : '') || '',
        consigneeName: (typeof bl.consignee === 'object' ? bl.consignee?.name : bl.consignee) || 'To Order of Destination Agent',
        consigneeAddress: (typeof bl.consignee === 'object' ? bl.consignee?.address : '') || pod,
        notifyPartyName: bl.notifyParty?.name || 'Same as Consignee',
        notifyPartyAddress: bl.notifyParty?.address || pod,
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
      let initConsolNum = initialShipment?.consolidationId || initialShipment?.consolidationNumber || initialConsolidationNumber || '';
      if (!initConsolNum && consolidationOptions.length > 0) {
        initConsolNum = consolidationOptions[0].num;
      }
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
        const trimmed = initConsolNum.trim().toLowerCase();
        let targetHbls = houseBills.filter(hb =>
          hb.assignedConsolidationId && hb.assignedConsolidationId.trim().toLowerCase() === trimmed
        );
        const found = consolidations.find(c =>
          (c.consolidationNumber && c.consolidationNumber.toLowerCase() === trimmed) ||
          (c.id && String(c.id).toLowerCase() === trimmed)
        );
        if (targetHbls.length === 0 && found) {
          const matchedHbls = houseBills.filter(hb =>
            hb.assignedConsolidationId === found.consolidationNumber ||
            hb.assignedConsolidationId === found.id ||
            (Array.isArray(found.houseBillIds) && (found.houseBillIds.includes(hb.hblNumber) || found.houseBillIds.includes(hb.id)))
          );
          targetHbls = matchedHbls;
        }

        if (targetHbls.length > 0) {
          initialHblIds = targetHbls.map(h => h.hblNumber || h.id);
          let sumPkgs = 0;
          let sumWeightLbs = 0;
          let sumCbm = 0;
          targetHbls.forEach(h => {
            sumPkgs += Number(h.totalPackages || h.packageCount || 1);
            sumWeightLbs += Number(h.totalWeightLbs || 0);
            sumCbm += Number(h.totalCbm || 0);
          });
          initialPackageCount = sumPkgs;
          initialGrossWeight = Math.round(sumWeightLbs);
          initialCbm = Number(sumCbm.toFixed(2));
          initialPod = found?.destinationPort || targetHbls[0]?.destinationPort || initialPod || 'STT - Port of Charlotte Amalie';
        }

        if (found) {
          if (!initialVessel) initialVessel = found.vesselName || 'M/V Caribbean Carrier';
          if (!initialCarrier) initialCarrier = found.carrier || 'Tropical Shipping';
          if (!initialContainer) initialContainer = found.containerNumber || 'MSKU-829104-5';
          if (!initialSeal) initialSeal = found.sealNumber || 'SEAL-VI-8821';
          if (!initialConsignee) initialConsignee = found.agentName ? `${found.agentName} (Destination Agent)` : 'To Order of Destination Agent';
        }
      }

      if (!initialVessel) initialVessel = 'M/V Caribbean Carrier';
      if (!initialCarrier) initialCarrier = 'Tropical Shipping';
      if (!initialContainer) initialContainer = 'MSKU-829104-5';
      if (!initialSeal) initialSeal = 'SEAL-VI-8821';
      if (!initialPod) initialPod = 'STT - Port of Charlotte Amalie';
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
        cargoDescription: initialHblIds.length > 0
          ? `Consolidation ${initConsolNum}: ${initialHblIds.length} House B/Ls (${initialPackageCount} Packages) consigned for ${initialPod}.`
          : `Consolidated ocean freight merchandise for ${initialPod}.`,
        packageCount: initialPackageCount,
        packageType: 'Packages',
        grossWeightLbs: initialGrossWeight,
        cbm: initialCbm,
        freightTerms: 'Freight Prepaid',
        status: 'Draft'
      });
    }
  }, [isOpen, bl, isEdit, initialConsolidationNumber, initialShipment, consolidations, houseBills, consolidationOptions]);

  // Handle Consolidation text input change
  const handleConsolidationChange = (consolNum) => {
    setSelectedConsolidationNumber(consolNum);

    if (!consolNum) {
      setSelectedHouseBillIds([]);
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
      const destPortName = selectedConsol?.destinationPort || firstHbl?.destinationPort || formData.portOfDischarge || 'STT - Port of Charlotte Amalie';

      setFormData(prev => ({
        ...prev,
        oceanVessel: selectedConsol?.vesselName || prev.oceanVessel || 'M/V Caribbean Carrier',
        carrier: selectedConsol?.carrier || prev.carrier || 'Tropical Shipping',
        portOfDischarge: destPortName || prev.portOfDischarge,
        consigneeName: prev.consigneeName || (selectedConsol?.agentName ? `${selectedConsol.agentName} (Destination Agent)` : 'To Order of Destination Agent'),
        consigneeAddress: prev.consigneeAddress || destPortName,
        notifyPartyName: prev.notifyPartyName || selectedConsol?.agentName || 'Same as Consignee',
        notifyPartyAddress: prev.notifyPartyAddress || destPortName,
        containerNumber: selectedConsol?.containerNumber || prev.containerNumber || 'MSKU-829104-5',
        sealNumber: selectedConsol?.sealNumber || prev.sealNumber || 'SEAL-VI-8821',
        packageCount: sumPkgs,
        grossWeightLbs: Math.round(sumWeightLbs),
        cbm: Number(sumCbm.toFixed(2)),
        cargoDescription: `Consolidation ${consolNum}: ${targetHbls.length} House B/Ls (${sumPkgs} Packages) consigned for ${destPortName || 'Destination'}.`
      }));
    } else if (selectedConsol) {
      const destPortName = selectedConsol.destinationPort || selectedConsol.dischargePort || formData.portOfDischarge;
      setFormData(prev => ({
        ...prev,
        oceanVessel: selectedConsol.vesselName || prev.oceanVessel || 'M/V Caribbean Carrier',
        carrier: selectedConsol.carrier || prev.carrier || 'Tropical Shipping',
        portOfDischarge: destPortName,
        containerNumber: selectedConsol.containerNumber || prev.containerNumber || 'MSKU-829104-5',
        sealNumber: selectedConsol.sealNumber || prev.sealNumber || 'SEAL-VI-8821',
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
        name: formData.shipperName?.trim() || 'VI Customs Brokers & Logistics',
        address: formData.shipperAddress?.trim() || '1200 NW 78th Ave, Miami, FL 33126'
      },
      consignee: {
        id: formData.consigneeId || undefined,
        name: formData.consigneeName?.trim() || 'To Order of Destination Agent',
        address: formData.consigneeAddress?.trim() || formData.portOfDischarge || 'Destination Port'
      },
      notifyParty: {
        name: formData.notifyPartyName?.trim() || 'Same as Consignee',
        address: formData.notifyPartyAddress?.trim() || formData.portOfDischarge || 'Destination Port'
      },
      oceanVessel: formData.oceanVessel || 'M/V Caribbean Carrier',
      carrier: formData.carrier || 'Tropical Shipping',
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
          <div ref={modalBodyRef} className="modal-body custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', flex: 1, minHeight: 0, padding: '1rem 1.25rem' }}>
            
            {/* STEP 1: Consolidation Link & Live Cargo Summary */}
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
                      Company Consolidation Number
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                      Select your company consolidation number to gather all associated House Bills into this container.
                    </p>
                  </div>
                </div>

                {selectedConsolObj && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1', background: '#E0F2FE', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                    Matched: {selectedConsolObj.consolidationNumber} ({selectedConsolObj.destinationPort || 'Consolidation'})
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                  Consolidation # <span className="required">*</span>
                </label>
                {consolidationOptions.length > 0 ? (
                  <select
                    className="form-select"
                    style={{
                      fontWeight: 600,
                      color: '#0A192F',
                      background: '#FFFFFF',
                      border: '1.5px solid #0284C7',
                      fontSize: '0.9rem'
                    }}
                    value={selectedConsolidationNumber}
                    onChange={(e) => handleConsolidationChange(e.target.value)}
                  >
                    <option value="">-- Select Company Consolidation Number --</option>
                    {consolidationOptions.map(opt => (
                      <option key={opt.num} value={opt.num}>
                        {opt.num} • {opt.destinationPort || 'Caribbean'} ({opt.hblCount} House Bills • {opt.totalPackages} pkgs • {opt.totalWeightLbs} lbs)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Consolidation # (e.g. CNS-2026-001)"
                      value={selectedConsolidationNumber}
                      onChange={(e) => handleConsolidationChange(e.target.value)}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      Tip: Create House Bills in Step 2 under your Consolidation Number to automatically populate this dropdown.
                    </span>
                  </div>
                )}
              </div>

              {/* Connected Live Aggregated Cargo Summary */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))',
                gap: '0.5rem',
                background: '#FFFFFF',
                border: '1px solid #BAE6FD',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                marginTop: '2px'
              }}>
                <div>
                  <div style={{ fontSize: '0.62rem', color: '#0369A1', fontWeight: 700, textTransform: 'uppercase' }}>Selected HBLs</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0C4A6E' }}>
                    {selectedHouseBillIds.length} House B/Ls
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', color: '#0369A1', fontWeight: 700, textTransform: 'uppercase' }}>Total Packages</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0C4A6E' }}>
                    {formData.packageCount} pkgs
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', color: '#0369A1', fontWeight: 700, textTransform: 'uppercase' }}>Gross Weight</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0C4A6E' }}>
                    {Number(formData.grossWeightLbs).toLocaleString()} lbs
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', color: '#0369A1', fontWeight: 700, textTransform: 'uppercase' }}>Volume</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#D97706' }}>
                    {Number((formData.cbm * 35.3147).toFixed(1))} CFT <span style={{ fontSize: '0.68rem', color: '#0369A1' }}>({formData.cbm} CBM)</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', color: '#0369A1', fontWeight: 700, textTransform: 'uppercase' }}>Discharge Port</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284C7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formData.portOfDischarge || 'Destination'}
                  </div>
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
                <div style={{ padding: '0.75rem 1rem', textAlign: 'center', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '6px', color: '#64748B', fontSize: '0.8rem' }}>
                  📦 <strong>0 House Bills found for this consolidation.</strong>
                  <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '3px' }}>
                    In Kedreana's 3-step workflow, first create House Bills in Step 2 with this Consolidation Number. They will automatically appear here.
                  </div>
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



            {/* STEP 3: Carrier & Leased Container (VOCC Ocean Equipment) */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0A192F', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Carrier & Leased Container (VOCC Equipment)</span>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 400 }}>POL: Miami (USMIA)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Ocean Carrier</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Tropical Shipping"
                    value={formData.carrier}
                    onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Ocean Vessel / Voyage</label>
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
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Container Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. MSKU-829104-5"
                    value={formData.containerNumber}
                    onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Bolt Seal Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. SEAL-VI-8821"
                    value={formData.sealNumber}
                    onChange={(e) => setFormData({ ...formData, sealNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* STEP 4: Master B/L Reference & Parties Summary */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Master B/L Number</label>
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
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Issue Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                fontSize: '0.72rem',
                color: '#64748B',
                paddingTop: '0.4rem',
                borderTop: '1px solid #E2E8F0'
              }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Shipper (Forwarder):</span> VI Customs Brokers & Logistics (Miami)
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Consignee:</span> To Order of Destination Agent ({formData.portOfDischarge || 'Caribbean'})
                </div>
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
              <span>{isEdit ? 'Save Master B/L Changes' : `Create Master Bill of Lading (${selectedHouseBillIds.length} Linked HBLs)`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
