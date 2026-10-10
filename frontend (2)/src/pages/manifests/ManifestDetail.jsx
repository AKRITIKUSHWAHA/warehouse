import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ManifestViewer } from '../../components/documents/ManifestViewer';
import { ManifestModal } from '../../components/modals/ManifestModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { FileSpreadsheet, ArrowLeft, Printer, FileCode, Download, Edit2, Trash2 } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { manifestService } from '../../services/manifestService';

import { WorkflowIndicator } from '../../components/common/WorkflowIndicator';

export const ManifestDetail = ({ manifestId, onNavigate }) => {
  const { manifests, updateManifest, deleteManifest } = useAppData();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [liveManifest, setLiveManifest] = useState(null);

  const manifest = manifests.find(m => m.id === manifestId || m.manifestNumber === manifestId);

  React.useEffect(() => {
    if (!manifest && manifestId) {
      manifestService.getManifestById(manifestId).then(res => {
        if (res) setLiveManifest(res);
      });
    }
  }, [manifest, manifestId]);

  const currentManifest = manifest || liveManifest;

  if (!currentManifest) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h3>Shipping Manifest Not Found</h3>
        <button onClick={() => onNavigate('manifests')} className="btn btn-primary btn-sm mt-4">
          Back to Manifests List
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        title={`Shipping Manifest ${currentManifest.manifestNumber}`}
        subtitle={`${currentManifest.vesselName} (${currentManifest.voyageNumber}) — ${currentManifest.portOfLoading} to ${currentManifest.portOfDischarge}`}
        icon={FileSpreadsheet}
        breadcrumbs={[
          { label: 'Shipping Manifests', href: '#' },
          { label: currentManifest.manifestNumber }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('manifests')}
              className="btn btn-outline btn-sm"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="btn btn-secondary btn-sm"
            >
              <Edit2 size={15} />
              <span>Edit Manifest</span>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-danger btn-sm"
            >
              <Trash2 size={15} />
              <span>Delete Manifest</span>
            </button>
          </div>
        }
      />

      {/* Primary Workflow Journey Indicator */}
      <WorkflowIndicator currentStage="manifests" onStageClick={(stageId) => onNavigate(stageId)} />

      {/* Status + Next Step Action Guide */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '0.875rem 1.25rem',
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: '#16A34A',
            color: '#FFFFFF',
            borderRadius: '6px',
            padding: '0.35rem 0.65rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.04em'
          }}>
            CURRENT STATUS: {currentManifest.status?.toUpperCase() || 'READY'}
          </div>
          <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
            Next Step: Handover manifest to Destination Agent & Customs Clearance
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onNavigate('agent-portal')}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.8rem' }}
          >
            View Destination Agent View &rarr;
          </button>
        </div>
      </div>

      {/* Embedded Manifest Viewer with Portrait / Landscape Toggle */}
      <ManifestViewer manifest={currentManifest} />

      {/* Edit Manifest Modal */}
      <ManifestModal
        isOpen={showEditModal}
        manifest={currentManifest}
        isEdit={true}
        onClose={() => setShowEditModal(false)}
        onSave={async (updates) => {
          await updateManifest(currentManifest.id, updates);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        itemName={currentManifest.manifestNumber}
        itemType="Manifest"
        onConfirm={async () => {
          await deleteManifest(currentManifest.id);
          onNavigate('manifests');
        }}
      />
    </div>
  );
};

