import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AgentModal } from '../../components/modals/AgentModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { Users, ArrowLeft, Ship, Mail, Phone, MapPin, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';

export const AgentDetail = ({ agentId, onNavigate }) => {
  const { agents, shipments, updateAgent, deleteAgent } = useAppData();
  const { switchUser } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const agent = agents.find(a => a.id === agentId || a.agentCode === agentId);

  if (!agent) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h3>Agent Not Found</h3>
        <button onClick={() => onNavigate('agents')} className="btn btn-primary btn-sm mt-4">
          Back to Agents
        </button>
      </div>
    );
  }

  const assignedShipments = shipments.filter(s => s.agentId === agent.id || agent.assignedShipments?.includes(s.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1100px', margin: '0 auto' }}>
      <PageHeader
        title={agent.name}
        subtitle={`Agent Code: ${agent.agentCode} • Territory: ${agent.territory}`}
        icon={Users}
        breadcrumbs={[
          { label: 'Agents', href: '#' },
          { label: agent.name }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('agents')} className="btn btn-outline btn-sm">
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="btn btn-secondary btn-sm"
            >
              <Edit2 size={15} />
              <span>Edit Agent</span>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-danger btn-sm"
            >
              <Trash2 size={15} />
              <span>Delete Agent</span>
            </button>
            <button
              onClick={() => {
                switchUser('USR-004');
                onNavigate('agent-dashboard');
              }}
              className="btn btn-primary btn-sm"
            >
              <ExternalLink size={15} />
              <span>Open Agent Portal View</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-5">
        <div style={{ gridColumn: 'span 5' }} className="col-span-5-mobile">
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0A192F' }}>Agent Profile</div>
              <StatusBadge status={agent.status} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Contact Person</span>
                <div style={{ fontWeight: 700 }}>{agent.contactPerson}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Email Address</span>
                <div style={{ fontWeight: 600, color: '#0284C7' }}>{agent.email}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Phone / Hotline</span>
                <div style={{ fontWeight: 600 }}>{agent.phone}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Physical Terminal Address</span>
                <div style={{ color: '#334155' }}>{agent.address}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Authorized Credit Limit</span>
                <div style={{ fontWeight: 700, color: '#059669' }}>${agent.creditLimitUsd?.toLocaleString()} USD</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ gridColumn: 'span 7' }} className="col-span-7-mobile">
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#0A192F' }}>
              Assigned Shipments ({assignedShipments.length})
            </h3>

            {assignedShipments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {assignedShipments.map(s => (
                  <div
                    key={s.id}
                    onClick={() => onNavigate('shipments', s.id)}
                    style={{ padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    className="card-hover"
                  >
                    <div>
                      <strong style={{ color: '#0A192F' }}>{s.shipmentNumber}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Vessel: {s.vesselName || 'Ocean Vessel'} • ETA: {s.eta}
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                No active shipments currently assigned to this port agent.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Agent Modal */}
      <AgentModal
        isOpen={showEditModal}
        agent={agent}
        isEdit={true}
        onClose={() => setShowEditModal(false)}
        onSave={async (updates) => {
          await updateAgent(agent.id, updates);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        itemName={agent.name}
        itemType="Agent"
        onConfirm={async () => {
          await deleteAgent(agent.id);
          onNavigate('agents');
        }}
      />
    </div>
  );
};

