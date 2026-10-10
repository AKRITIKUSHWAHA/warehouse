import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Ship, ArrowLeft, Check } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const CreateShipment = ({ onNavigate }) => {
  const { createShipment, vessels, agents, shipments, ports } = useAppData();

  const getPortCode = (p) => p?.portCode || p?.code || 'PORT';
  const defaultPortObj = ports.find(p => getPortCode(p) === 'NAS') || ports[0];
  const defaultPortName = defaultPortObj ? `${defaultPortObj.name} (${getPortCode(defaultPortObj)})` : 'Nassau, Bahamas (BSNAS)';
  const defaultPortCode = defaultPortObj ? getPortCode(defaultPortObj) : 'NAS';

  const [formData, setFormData] = useState({
    type: 'Master Ocean FCL',
    origin: 'Port of Miami (USMIA)',
    destinationPort: defaultPortName,
    destinationCode: defaultPortCode,
    agentId: agents[0]?.id || null,
    agentName: agents[0]?.name || '',
    vesselName: vessels[0]?.name || 'MV Caribbean Carrier',
    voyageNumber: `VOY-2026-${Math.floor(100 + Math.random() * 900)}`,
    carrier: 'Tropical Shipping Line',
    containerNumber: '',
    containerType: "40' High Cube",
    sealNumber: `SEAL-VI-${Math.floor(10000 + Math.random() * 90000)}`,
    totalPackages: 1,
    totalWeightLbs: 0,
    totalWeightKg: 0,
    totalCft: 0,
    totalCbm: 0,
    etd: new Date().toISOString().split('T')[0],
    eta: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const created = await createShipment(formData);
    onNavigate('shipments', created?.id || created?.shipmentNumber);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <PageHeader
        title="Create Direct Master Shipment"
        subtitle="Register a direct full container load (FCL) or charter shipment."
        icon={Ship}
        breadcrumbs={[
          { label: 'Shipments', href: '#' },
          { label: 'New Shipment' }
        ]}
        actions={
          <button onClick={() => onNavigate('shipments')} className="btn btn-outline btn-sm">
            <ArrowLeft size={15} />
            <span>Cancel</span>
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', color: '#0A192F', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
          Shipment Routing &amp; Carrier Assignment
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Service Type <span className="required">*</span></label>
            <select
              className="form-select"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="Master Ocean FCL">Master Ocean FCL (Full Container)</option>
              <option value="Ocean LCL Consolidation">Ocean LCL Consolidation</option>
              <option value="Air Freight Direct">Air Freight Direct</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Destination Port <span className="required">*</span></label>
            <select
              className="form-select"
              value={formData.destinationPort}
              onChange={(e) => {
                const dest = e.target.value;
                const matched = ports.find(p => `${p.name} (${getPortCode(p)})` === dest || p.name === dest);
                const code = matched ? getPortCode(matched) : (dest.includes('(') ? dest.split('(')[1].replace(')', '') : 'NAS');
                setFormData({ ...formData, destinationPort: dest, destinationCode: code });
              }}
            >
              {ports.map(p => {
                const pCode = getPortCode(p);
                const label = `${p.name} (${pCode})`;
                return (
                  <option key={`shp-dest-${p.id || pCode}`} value={label}>
                    {p.name} ({pCode}) — {p.island || p.country || 'Port'}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label">Ocean Vessel <span className="required">*</span></label>
            <select
              className="form-select"
              value={formData.vesselName}
              onChange={(e) => setFormData({ ...formData, vesselName: e.target.value })}
            >
              {vessels.map(v => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Voyage Number</label>
            <input
              type="text"
              className="form-control"
              value={formData.voyageNumber}
              onChange={(e) => setFormData({ ...formData, voyageNumber: e.target.value })}
              required
            />
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

        <div className="grid grid-cols-3 gap-4">
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
            <label className="form-label">Container Type</label>
            <select
              className="form-select"
              value={formData.containerType}
              onChange={(e) => setFormData({ ...formData, containerType: e.target.value })}
            >
              <option value="40' High Cube">40' High Cube</option>
              <option value="40' Standard GP">40' Standard GP</option>
              <option value="20' Standard GP">20' Standard GP</option>
              <option value="45' High Cube">45' High Cube</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Bolt Seal Number</label>
            <input
              type="text"
              className="form-control"
              value={formData.sealNumber}
              onChange={(e) => setFormData({ ...formData, sealNumber: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label">Total Packages</label>
            <input
              type="number"
              className="form-control"
              value={formData.totalPackages}
              onChange={(e) => setFormData({ ...formData, totalPackages: Number(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Gross Weight (Lbs)</label>
            <input
              type="number"
              className="form-control"
              value={formData.totalWeightLbs}
              onChange={(e) => setFormData({ ...formData, totalWeightLbs: Number(e.target.value), totalWeightKg: Number((Number(e.target.value) * 0.453592).toFixed(1)) })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Volume (CBM)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={formData.totalCbm}
              onChange={(e) => setFormData({ ...formData, totalCbm: Number(e.target.value), totalCft: Number((Number(e.target.value) * 35.3147).toFixed(2)) })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
          <button type="button" onClick={() => onNavigate('shipments')} className="btn btn-outline">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Check size={16} />
            <span>Create Master Shipment</span>
          </button>
        </div>
      </form>
    </div>
  );
};
