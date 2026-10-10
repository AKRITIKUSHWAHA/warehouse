import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Settings, Save, RotateCcw, Building, FileText, Printer, Anchor, Plus, Edit2, Trash2, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { PortModal } from '../../components/modals/PortModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';

export const SettingsPage = () => {
  const { settings, updateSettings, resetDemoData, clearAllData, ports, createPort, updatePort, deletePort, fetchMenuApi } = useAppData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('ports'); // 'ports' | 'branding' | 'sequences' | 'data_management'

  useEffect(() => {
    if (fetchMenuApi) {
      if (!settings || Object.keys(settings).length === 0) {
        fetchMenuApi('settings');
      }
      if (!ports || ports.length === 0) {
        fetchMenuApi('ports');
      }
    }
  }, [fetchMenuApi]);

  // Port modal states
  const [showPortModal, setShowPortModal] = useState(false);
  const [editingPort, setEditingPort] = useState(null);
  const [deletingPort, setDeletingPort] = useState(null);

  const [formData, setFormData] = useState(settings || {
    companyProfile: {
      companyName: "VI Customs Brokers & Logistics",
      legalName: "VI Customs Brokers & Logistics",
      taxId: "EIN-59-9948210",
      fmcNumber: "FMC-OTI #028914N",
      addressLine1: "8400 NW 36th Street, Suite 500",
      city: "Miami",
      state: "Florida",
      zipCode: "33166",
      country: "United States",
      phone: "+1 (305) 555-KERS (5377)",
      email: "operations@vicustoms.com"
    },
    numberingRules: {
      warehouseReceiptPrefix: "WR-2026-",
      houseBillPrefix: "HBL-2026-",
      billOfLadingPrefix: "BL-VI-2026-",
      shipmentPrefix: "SHP-2026-",
      consolidationPrefix: "CNS-2026-",
      manifestPrefix: "MNF-2026-"
    },
    labelSettings: {
      rollSize: "4x6",
      barcodeType: "Code 128",
      primaryMeasurement: "CFT",
      includeQrCode: true,
      includeHandlingIcons: true
    },
    unitsAndCurrencies: {
      defaultWeightUnit: "LBS",
      defaultVolumeUnit: "CFT (Primary) / CBM",
      defaultCurrency: "USD ($)"
    }
  });

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData(prev => ({
        ...prev,
        companyProfile: { ...prev.companyProfile, ...(settings.companyProfile || {}) },
        numberingRules: { ...prev.numberingRules, ...(settings.numberingRules || {}) },
        labelSettings: { ...prev.labelSettings, ...(settings.labelSettings || {}) },
        unitsAndCurrencies: { ...prev.unitsAndCurrencies, ...(settings.unitsAndCurrencies || {}) }
      }));
    }
  }, [settings]);

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings(formData);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <PageHeader
        title="Settings &amp; Master System Config"
        subtitle="Manage custom island port destinations, customer service routes, branding, and testing data."
        icon={Settings}
        breadcrumbs={[
          { label: 'System', href: '#' },
          { label: 'Settings' }
        ]}
      />

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('ports')}
          style={{
            padding: '0.65rem 1.1rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: activeTab === 'ports' ? '#0284C7' : '#64748B',
            borderBottom: activeTab === 'ports' ? '3px solid #0284C7' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Anchor size={16} />
          <span>Island Ports &amp; Destinations ({ports.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          style={{
            padding: '0.65rem 1.1rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: activeTab === 'branding' ? '#0284C7' : '#64748B',
            borderBottom: activeTab === 'branding' ? '3px solid #0284C7' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Building size={16} />
          <span>Company Branding &amp; Sequences</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('data_management')}
          style={{
            padding: '0.65rem 1.1rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: activeTab === 'data_management' ? '#D97706' : '#64748B',
            borderBottom: activeTab === 'data_management' ? '3px solid #D97706' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ShieldAlert size={16} />
          <span>Testing &amp; Data Clean Slate</span>
        </button>
      </div>

      {/* TAB 1: Ports & Island Destinations */}
      {activeTab === 'ports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', color: '#0A192F', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Anchor size={18} style={{ color: '#0284C7' }} />
                  <span>Custom Island Ports &amp; Cargo Discharge Terminals</span>
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0 0' }}>
                  Add and customize the islands and ports you service. These destinations automatically populate all Customer Registration, Warehouse Intake, House B/L, Consolidation, and Manifest dropdowns.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPortModal(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={15} />
                <span>Add Island Port Destination</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
              <table className="data-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#0A192F', color: '#FFFFFF' }}>
                    <th style={{ width: '80px' }}>Code</th>
                    <th>Island / Region</th>
                    <th>Port Terminal Name</th>
                    <th>Country</th>
                    <th>Default Port Agent</th>
                    <th style={{ width: '90px' }}>Status</th>
                    <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ports.map((port) => (
                    <tr key={port.id || port.code || port.portCode}>
                      <td style={{ fontWeight: 800, color: '#0284C7', fontFamily: 'JetBrains Mono, monospace' }}>
                        {port.code || port.portCode}
                      </td>
                      <td style={{ fontWeight: 600 }}>{port.island}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0A192F' }}>{port.name}</div>
                      </td>
                      <td style={{ color: '#475569' }}>{port.country}</td>
                      <td style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {port.defaultAgent || '—'}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.72rem', background: '#ECFDF5', color: '#059669', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          {port.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingPort(port)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.2rem 0.4rem', color: '#0284C7' }}
                            title="Edit Port"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingPort(port)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.2rem 0.4rem', color: '#EF4444' }}
                            title="Delete Port"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Branding & Sequences */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Company Profile Section */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#0A192F', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <Building size={18} style={{ color: '#0284C7' }} />
              <span>Company Branding &amp; Legal Profile</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Brand Trade Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.companyProfile?.companyName}
                  onChange={(e) => setFormData({
                    ...formData,
                    companyProfile: { ...formData.companyProfile, companyName: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Legal Name &amp; FMC License #</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.companyProfile?.fmcNumber}
                  onChange={(e) => setFormData({
                    ...formData,
                    companyProfile: { ...formData.companyProfile, fmcNumber: e.target.value }
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">CFS Miami Terminal Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.companyProfile?.addressLine1}
                  onChange={(e) => setFormData({
                    ...formData,
                    companyProfile: { ...formData.companyProfile, addressLine1: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Operations Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.companyProfile?.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    companyProfile: { ...formData.companyProfile, phone: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Operations Email</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.companyProfile?.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    companyProfile: { ...formData.companyProfile, email: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Numbering Sequences Section */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#0A192F', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <FileText size={18} style={{ color: '#D97706' }} />
              <span>Document Numbering Sequences</span>
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Warehouse Receipt Prefix</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.numberingRules?.warehouseReceiptPrefix}
                  onChange={(e) => setFormData({
                    ...formData,
                    numberingRules: { ...formData.numberingRules, warehouseReceiptPrefix: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">House B/L Prefix</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.numberingRules?.houseBillPrefix || 'HBL-2026-'}
                  onChange={(e) => setFormData({
                    ...formData,
                    numberingRules: { ...formData.numberingRules, houseBillPrefix: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Master B/L Prefix</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.numberingRules?.billOfLadingPrefix}
                  onChange={(e) => setFormData({
                    ...formData,
                    numberingRules: { ...formData.numberingRules, billOfLadingPrefix: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Data Management & Clean Slate Testing */}
      {activeTab === 'data_management' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #D97706' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ background: '#FEF3C7', color: '#D97706', padding: '0.75rem', borderRadius: '8px' }}>
                <Sparkles size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', color: '#0A192F', margin: 0 }}>
                  Option A: Clear All Data (Start Fresh Blank Slate)
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', margin: '6px 0 1rem 0' }}>
                  Wipes out all temporary mock transactions and master data (Customers, Ports, Vessels, Agents, Containers, etc.) so you can test entering your own real data from a completely empty, clean slate.
                  <br />
                  <em>Only Staff Logins and System Settings will remain saved!</em>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to clear all data records and start fresh with a blank slate?")) {
                      clearAllData();
                    }
                  }}
                  className="btn btn-primary"
                  style={{ background: '#D97706', borderColor: '#D97706' }}
                >
                  <Trash2 size={15} />
                  <span>Clear All Transactional Data (Blank Slate)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #64748B' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ background: '#F1F5F9', color: '#475569', padding: '0.75rem', borderRadius: '8px' }}>
                <RotateCcw size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', color: '#0A192F', margin: 0 }}>
                  Option B: Reset Demo Datasets to Factory Defaults
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', margin: '6px 0 1rem 0' }}>
                  Restores the full pre-populated mock dataset (sample Bahamas cargo, Caribbean Express shipments, demo House B/Ls, and manifests) if you want to inspect example records.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to reset all demo data back to factory defaults?")) {
                      resetDemoData();
                    }
                  }}
                  className="btn btn-outline"
                >
                  <RotateCcw size={15} />
                  <span>Reset All Data to Sample Defaults</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Port Modal */}
      <PortModal
        isOpen={showPortModal || !!editingPort}
        port={editingPort}
        isEdit={!!editingPort}
        onClose={() => {
          setShowPortModal(false);
          setEditingPort(null);
        }}
        onSave={async (portData) => {
          if (editingPort) {
            await updatePort(editingPort.id, portData);
          } else {
            await createPort(portData);
          }
        }}
      />

      {/* Delete Port Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingPort}
        onClose={() => setDeletingPort(null)}
        itemName={`${deletingPort?.code || deletingPort?.portCode} - ${deletingPort?.name}`}
        itemType="Island Port"
        onConfirm={async () => {
          await deletePort(deletingPort.id);
        }}
      />
    </div>
  );
};
