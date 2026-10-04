import { getStored, setStored, KEYS } from './storageService';
import { auditService } from './auditService';
import { apiClient } from './apiClient';
import { apiFetch } from './apiConfig';

export const manifestService = {
  async getManifests(filters = {}) {
    try {
      const res = await apiClient.get('manifests', { params: { ...filters, limit: 100 } });
      if (res && res.data) {
        const liveList = Array.isArray(res.data) ? res.data : (res.data.items || []);
        setStored(KEYS.MANIFESTS, liveList);
        return liveList;
      }
    } catch (err) {
      console.warn('Backend API /manifests fetch failed, using cached store:', err?.message || err);
    }

    const list = getStored(KEYS.MANIFESTS, []);
    let filtered = [...list];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.manifestNumber?.toLowerCase().includes(q) ||
        item.title?.toLowerCase().includes(q) ||
        item.vesselName?.toLowerCase().includes(q) ||
        item.voyageNumber?.toLowerCase().includes(q) ||
        item.portOfDischarge?.toLowerCase().includes(q)
      );
    }
    return filtered;
  },

  async getManifestById(id) {
    if (!id) return null;
    try {
      const res = await apiClient.get(`manifests/${encodeURIComponent(id)}`);
      if (res && res.data) return res.data;
    } catch (err) {
      console.warn(`Backend API fetch for manifest ${id} failed:`, err?.message || err);
    }

    const list = getStored(KEYS.MANIFESTS, []);
    return list.find(item => item.id === id || item.manifestNumber === id) || null;
  },

  async generateManifest(manifestData, currentUser = "Documentation Staff") {
    let createdManifest = null;
    try {
      const res = await apiClient.post('manifests', manifestData);
      if (res && res.data) {
        createdManifest = res.data;
      }
    } catch (err) {
      console.warn('Backend generateManifest failed:', err?.message || err);
      throw err;
    }

    if (!createdManifest) {
      const list = getStored(KEYS.MANIFESTS, []);
      const id = manifestData.manifestNumber || `MNF-2026-${443 + list.length}`;
      createdManifest = {
        ...manifestData,
        id,
        manifestNumber: id,
        type: "Ocean Cargo Inward / Outward Manifest",
        status: manifestData.status || "Generated",
        createdAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      };
    }

    const list = getStored(KEYS.MANIFESTS, []);
    const updated = [createdManifest, ...list.filter(m => m.id !== createdManifest.id && m.manifestNumber !== createdManifest.manifestNumber)];
    setStored(KEYS.MANIFESTS, updated);

    await auditService.logAction(
      currentUser,
      "Shipping Manifest",
      "Generated Shipping Manifest",
      createdManifest.manifestNumber || createdManifest.id,
      `Generated Manifest ${createdManifest.manifestNumber || createdManifest.id} for Vessel ${createdManifest.vesselName} (Voyage ${createdManifest.voyageNumber}).`
    );

    return createdManifest;
  },

  async updateManifest(id, updates, currentUser = "Documentation Staff") {
    let updatedManifest = null;
    try {
      const res = await apiClient.put(`manifests/${encodeURIComponent(id)}`, updates);
      if (res && res.data) {
        updatedManifest = res.data;
      }
    } catch (err) {
      console.warn(`Backend updateManifest ${id} failed:`, err?.message || err);
      throw err;
    }

    const list = getStored(KEYS.MANIFESTS, []);
    const index = list.findIndex(item => item.id === id || item.manifestNumber === id);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        ...(updatedManifest || updates)
      };
      setStored(KEYS.MANIFESTS, list);
      updatedManifest = list[index];
    }

    await auditService.logAction(
      currentUser,
      "Shipping Manifest",
      "Updated Shipping Manifest",
      id,
      `Updated Manifest ${id}.`
    );

    return updatedManifest;
  },

  async deleteManifest(id, currentUser = "Documentation Staff") {
    try {
      await apiClient.delete(`manifests/${encodeURIComponent(id)}`);
    } catch (err) {
      console.warn(`Backend deleteManifest ${id} failed:`, err?.message || err);
      throw err;
    }

    const list = getStored(KEYS.MANIFESTS, []);
    const existing = list.find(item => item.id === id || item.manifestNumber === id);
    const filtered = list.filter(item => item.id !== id && item.manifestNumber !== id);
    setStored(KEYS.MANIFESTS, filtered);

    if (existing) {
      await auditService.logAction(
        currentUser,
        "Shipping Manifest",
        "Deleted Shipping Manifest",
        id,
        `Deleted Manifest ${id}.`
      );
    }

    return true;
  },

  getResolvedLineItems(manifest) {
    if (!manifest) return [];
    if (manifest.lineItems && Array.isArray(manifest.lineItems) && manifest.lineItems.length > 0) {
      return manifest.lineItems;
    }
    const blNum = manifest.masterBLNumber || manifest.masterBLId;
    if (!blNum) return [];
    const bls = getStored(KEYS.BILLS_OF_LADING, []);
    const hbls = getStored(KEYS.HOUSE_BILLS, []);
    const bl = bls.find(b => b.blNumber === blNum || b.id === blNum);
    if (!bl) return [];
    const linkedHbls = hbls.filter(h =>
      h.assignedMasterBLId === bl.id ||
      h.assignedMasterBLId === bl.blNumber ||
      bl.houseBillIds?.includes(h.hblNumber)
    );
    if (linkedHbls.length > 0) {
      return linkedHbls.map((h, idx) => ({
        itemNumber: idx + 1,
        hblNumber: h.hblNumber,
        blNumber: bl.blNumber,
        shipper: typeof h.shipper === 'object' ? h.shipper.name : h.shipper || 'Miami CFS Hub',
        consignee: typeof h.consignee === 'object' ? h.consignee.name : h.consignee || h.customerName || 'Consignee',
        notifyParty: typeof h.notifyParty === 'object' ? h.notifyParty.name : h.notifyParty || bl.agentName || 'Port Destination Agent',
        containerNumber: bl.containerNumber || 'MSKU-829104-5',
        sealNumber: bl.sealNumber || 'SEAL-VI-8821',
        packageCount: h.totalPieces || h.totalPackages || 1,
        totalPieces: h.totalPieces || h.totalPackages || 1,
        packageType: 'Cartons / Pallets',
        cargoDescription: h.cargoDescription || 'Consolidated Cargo Goods',
        grossWeightLbs: Number(h.totalWeightLbs) || 0,
        grossWeightKg: Number(h.totalWeightKg) || Number(((Number(h.totalWeightLbs) || 0) * 0.453592).toFixed(1)),
        cft: Number(h.totalCft) || Number(((Number(h.totalCbm) || 0) * 35.3147).toFixed(2)),
        cbm: Number(h.totalCbm) || 0,
        customsValueUsd: Number(((h.totalPieces || 1) * 1250).toFixed(2)) || 25000.00
      }));
    }
    return [
      {
        itemNumber: 1,
        hblNumber: 'DIRECT',
        blNumber: bl.blNumber,
        shipper: typeof bl.shipper === 'object' ? bl.shipper.name : bl.shipper || 'Miami CFS Hub',
        consignee: typeof bl.consignee === 'object' ? bl.consignee.name : bl.consignee || 'Consignee',
        notifyParty: typeof bl.notifyParty === 'object' ? bl.notifyParty.name : bl.notifyParty || bl.agentName || 'Port Destination Agent',
        containerNumber: bl.containerNumber || 'MSKU-829104-5',
        sealNumber: bl.sealNumber || 'SEAL-VI-8821',
        packageCount: Number(bl.packageCount) || 1,
        packageType: bl.packageType || 'Packages',
        cargoDescription: bl.cargoDescription || 'Consolidated Sea Freight',
        grossWeightLbs: Number(bl.grossWeightLbs || bl.weightLbs) || 0,
        grossWeightKg: Number(bl.grossWeightKg) || Number(((Number(bl.grossWeightLbs || bl.weightLbs) || 0) * 0.453592).toFixed(1)),
        cft: Number(bl.cft) || 0,
        cbm: Number(bl.cbm) || 0,
        customsValueUsd: 25000.00
      }
    ];
  },

  // Generates and downloads real CSV file
  exportCsv(manifest) {
    if (!manifest) return;
    const lineItems = this.getResolvedLineItems(manifest);
    if (!lineItems || lineItems.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Item #,House B/L,Master B/L,Shipper,Consignee,Notify Party,Container #,Seal #,Packages,Package Type,Description,Gross Wt (LBS),Gross Wt (KG),CFT (Primary),CBM (Secondary),Customs Value (USD)\r\n";

    lineItems.forEach(item => {
      const cftVal = item.cft || Number(((item.cbm || 0) * 35.3147).toFixed(2));
      const row = [
        item.itemNumber,
        `"${item.hblNumber || 'DIRECT'}"`,
        `"${item.blNumber}"`,
        `"${(item.shipper || '').replace(/"/g, '""')}"`,
        `"${(item.consignee || '').replace(/"/g, '""')}"`,
        `"${(item.notifyParty || '').replace(/"/g, '""')}"`,
        `"${item.containerNumber}"`,
        `"${item.sealNumber}"`,
        item.packageCount,
        `"${item.packageType}"`,
        `"${(item.cargoDescription || '').replace(/"/g, '""')}"`,
        item.grossWeightLbs,
        item.grossWeightKg,
        cftVal,
        item.cbm,
        item.customsValueUsd || ''
      ].join(",");
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KERS_Manifest_${manifest.manifestNumber}_${manifest.voyageNumber || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Generates and downloads real standardized Customs XML
  exportXml(manifest) {
    if (!manifest) return;
    const lineItems = this.getResolvedLineItems(manifest);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<OceanCargoManifest xmlns="urn:kers:customs:manifest:v1">\n`;
    xml += `  <Header>\n`;
    xml += `    <ManifestNumber>${manifest.manifestNumber}</ManifestNumber>\n`;
    xml += `    <MessageType>OUTWARD_CARGO_MANIFEST</MessageType>\n`;
    xml += `    <Carrier>${manifest.carrier || 'VI Customs Brokers & Logistics'}</Carrier>\n`;
    xml += `    <VesselName>${manifest.vesselName}</VesselName>\n`;
    xml += `    <VoyageNumber>${manifest.voyageNumber}</VoyageNumber>\n`;
    xml += `    <PortOfLoading>${manifest.portOfLoading}</PortOfLoading>\n`;
    xml += `    <PortOfDischarge>${manifest.portOfDischarge}</PortOfDischarge>\n`;
    xml += `    <DepartureDate>${manifest.departureDate}</DepartureDate>\n`;
    xml += `    <EstimatedArrivalDate>${manifest.arrivalDate}</EstimatedArrivalDate>\n`;
    xml += `    <TotalBillsOfLading>${manifest.totalBLs || 1}</TotalBillsOfLading>\n`;
    xml += `    <TotalPackages>${manifest.totalPackages}</TotalPackages>\n`;
    xml += `    <TotalGrossWeightLbs>${manifest.totalWeightLbs || Number(((manifest.totalWeightKg || 0) * 2.20462).toFixed(1))}</TotalGrossWeightLbs>\n`;
    xml += `    <TotalGrossWeightKg>${manifest.totalWeightKg}</TotalGrossWeightKg>\n`;
    xml += `    <TotalVolumeCFT>${manifest.totalCft || Number(((manifest.totalCbm || 0) * 35.3147).toFixed(2))}</TotalVolumeCFT>\n`;
    xml += `    <TotalVolumeCBM>${manifest.totalCbm}</TotalVolumeCBM>\n`;
    xml += `  </Header>\n`;
    xml += `  <ConsignmentItems>\n`;

    lineItems.forEach(item => {
      const cftVal = item.cft || Number(((item.cbm || 0) * 35.3147).toFixed(2));
      xml += `    <Item index="${item.itemNumber}">\n`;
      xml += `      <HouseBillNumber>${item.hblNumber || 'DIRECT'}</HouseBillNumber>\n`;
      xml += `      <MasterBillOfLadingNumber>${item.blNumber}</MasterBillOfLadingNumber>\n`;
      xml += `      <Shipper><![CDATA[${item.shipper}]]></Shipper>\n`;
      xml += `      <Consignee><![CDATA[${item.consignee}]]></Consignee>\n`;
      xml += `      <NotifyParty><![CDATA[${item.notifyParty}]]></NotifyParty>\n`;
      xml += `      <ContainerDetails>\n`;
      xml += `        <ContainerNumber>${item.containerNumber}</ContainerNumber>\n`;
      xml += `        <SealNumber>${item.sealNumber}</SealNumber>\n`;
      xml += `      </ContainerDetails>\n`;
      xml += `      <CargoDetails>\n`;
      xml += `        <Packages count="${item.packageCount}" type="${item.packageType}" />\n`;
      xml += `        <Description><![CDATA[${item.cargoDescription}]]></Description>\n`;
      xml += `        <Weight unit="LBS">${item.grossWeightLbs || ''}</Weight>\n`;
      xml += `        <Weight unit="KG">${item.grossWeightKg}</Weight>\n`;
      xml += `        <Volume unit="CFT">${cftVal}</Volume>\n`;
      xml += `        <Volume unit="CBM">${item.cbm}</Volume>\n`;
      xml += `        <DeclaredCustomsValue currency="USD">${item.customsValueUsd || ''}</DeclaredCustomsValue>\n`;
      xml += `      </CargoDetails>\n`;
      xml += `    </Item>\n`;
    });

    xml += `  </ConsignmentItems>\n`;
    xml += `</OceanCargoManifest>`;

    const blob = new Blob([xml], { type: "text/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `KERS_Customs_Manifest_${manifest.manifestNumber}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
