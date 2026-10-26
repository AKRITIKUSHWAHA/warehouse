import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Settings, Save, Building, FileText } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';

export const SettingsPage = () => {
  const { settings, updateSettings, fetchMenuApi } = useAppData();
  const { showToast } = useToast();

  useEffect(() => {
    if (fetchMenuApi) {
      if (!settings || Object.keys(settings).length === 0) {
        fetchMenuApi('settings');
      }
    }
  }, [fetchMenuApi]);

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
    showToast('Company branding and numbering settings saved successfully.', 'success', 'Settings Saved');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <PageHeader
        title="Company &amp; Numbering Settings"
        subtitle="Manage company information, contact details, and document numbering sequences."
        icon={Settings}
        breadcrumbs={[
          { label: 'System', href: '#' },
          { label: 'Settings' }
        ]}
      />

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Company Profile Section */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1rem', color: '#0A192F', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', margin: 0 }}>
            <Building size={18} style={{ color: '#0284C7' }} />
            <span>Company Branding &amp; Legal Profile</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Brand Trade Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.companyProfile?.companyName || ''}
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
                value={formData.companyProfile?.fmcNumber || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  companyProfile: { ...formData.companyProfile, fmcNumber: e.target.value }
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">CFS Terminal Address</label>
              <input
                type="text"
                className="form-control"
                value={formData.companyProfile?.addressLine1 || ''}
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
                value={formData.companyProfile?.phone || ''}
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
                value={formData.companyProfile?.email || ''}
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
          <h3 style={{ fontSize: '1rem', color: '#0A192F', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', margin: 0 }}>
            <FileText size={18} style={{ color: '#D97706' }} />
            <span>Document Numbering Sequences</span>
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Warehouse Receipt Prefix</label>
              <input
                type="text"
                className="form-control"
                value={formData.numberingRules?.warehouseReceiptPrefix || 'WR-2026-'}
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
                value={formData.numberingRules?.billOfLadingPrefix || 'BL-VI-2026-'}
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
    </div>
  );
};
