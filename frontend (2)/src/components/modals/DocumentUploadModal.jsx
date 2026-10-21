import React, { useState } from 'react';
import { FileStack, X, Upload, FileText } from 'lucide-react';

export const DocumentUploadModal = ({
  isOpen,
  onClose,
  onUpload
}) => {
  const [formData, setFormData] = useState({
    docNumber: `DOC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    docType: 'Commercial Invoice',
    title: '',
    party: '',
    status: 'Active',
    fileName: '',
    fileSize: '1.4 MB',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpload({
      ...formData,
      title: formData.title || `${formData.docType} for ${formData.party || 'Consignment'}`,
      fileName: formData.fileName || `${formData.docType.toLowerCase().replace(/\s+/g, '_')}_scan.pdf`,
      date: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FileStack size={20} style={{ color: '#0284C7' }} />
            <span>Upload &amp; Attach Supporting Document</span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Document Reference # <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={formData.docNumber}
                  onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Document Type <span className="required">*</span></label>
                <select
                  className="form-select"
                  value={formData.docType}
                  onChange={(e) => setFormData({ ...formData, docType: e.target.value })}
                >
                  <option value="Commercial Invoice">Commercial Invoice</option>
                  <option value="Packing List">Packing List</option>
                  <option value="Customs Export Declaration">Customs Export Declaration</option>
                  <option value="Certificate of Origin">Certificate of Origin</option>
                  <option value="Dangerous Goods Declaration">Dangerous Goods Declaration</option>
                  <option value="Warehouse Intake Inspection">Warehouse Intake Inspection</option>
                  <option value="Proof of Delivery">Proof of Delivery</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Title / Document Description <span className="required">*</span></label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Commercial Invoice - Caribbean Hardware Order #9021"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Associated Shipper / Consignee / Party</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Island Retail Distribution Corp"
                value={formData.party}
                onChange={(e) => setFormData({ ...formData, party: e.target.value })}
              />
            </div>

            {/* Simulated File Attachment Upload Box */}
            <div style={{
              border: '2px dashed #CBD5E1',
              borderRadius: '8px',
              padding: '1.25rem',
              textAlign: 'center',
              background: '#F8FAFC',
              cursor: 'pointer'
            }}>
              <Upload size={28} style={{ color: '#64748B', margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                {formData.fileName ? `Selected file: ${formData.fileName}` : 'Click or drop PDF / Image here'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem' }}>
                Supports PDF, PNG, JPG, XML, CSV (Up to 25MB)
              </div>
              <input
                type="file"
                style={{ display: 'none' }}
                id="doc-file-input"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFormData({
                      ...formData,
                      fileName: e.target.files[0].name,
                      fileSize: `${(e.target.files[0].size / (1024 * 1024)).toFixed(1)} MB`
                    });
                  }
                }}
              />
              <label
                htmlFor="doc-file-input"
                className="btn btn-sm btn-outline mt-2"
                style={{ cursor: 'pointer', display: 'inline-flex' }}
              >
                Browse Files
              </label>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes &amp; Internal Remarks</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Optional notes or references..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              <Upload size={14} />
              <span>Upload &amp; Attach Document</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
