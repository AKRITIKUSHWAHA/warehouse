import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { HoldAlertBanner } from '../../components/common/HoldAlertBanner';
import {
  Ship,
  FileText,
  FileStack,
  AlertTriangle,
  ArrowRight,
  Shield,
  PhoneCall,
  Clock,
  CheckCircle2,
  Lock,
  Package,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { agentPortalService } from '../../services/agentPortalService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AgentDashboard = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [shipments, setShipments] = useState([]);
  const [billsOfLading, setBillsOfLading] = useState([]);
  const [manifests, setManifests] = useState([]);
  const [holdBLs, setHoldBLs] = useState([]);
  const [stats, setStats] = useState({
    assignedCount: 0,
    holdCount: 0,
    documentsCount: 0,
    totalCbm: '0.00',
    totalCft: '0.00',
    totalPackages: 0,
  });

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const data = await agentPortalService.getDashboardData();
      setShipments(data.shipments);
      setBillsOfLading(data.billsOfLading);
      setManifests(data.manifests);
      setHoldBLs(data.holdBLs);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load agent dashboard data from API:', err);
      setError(err.message || 'Failed to fetch live agent data from backend');
      showToast(err.message || 'Error loading dashboard from server', 'danger', 'API Error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '400px', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: '#0284C7' }} />
        <div style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 600 }}>
          Connecting to PostgreSQL Backend &amp; Loading Inbound Consignments...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Agent Portal Dashboard"
        subtitle="Manage assigned cargo, clearance documents, and vessel arrivals for your destination port."
        icon={Shield}
        actions={
          <button
            onClick={() => loadData(true)}
            className="btn btn-outline btn-sm"
            disabled={isRefreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live DB'}</span>
          </button>
        }
      />

      {/* Error Alert if API failed */}
      {error && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#991B1B',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span><strong>Connection Issue:</strong> {error}</span>
          </div>
          <button onClick={() => loadData()} className="btn btn-sm btn-danger" style={{ padding: '0.25rem 0.6rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Prominent Hold Warning Banner for Agent */}
      {holdBLs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {holdBLs.map(bl => (
            <HoldAlertBanner
              key={bl.id || bl.blNumber}
              blNumber={bl.blNumber}
              holdDetails={bl.holdDetails}
              variant="danger"
            />
          ))}
        </div>
      )}

      {/* KPI Cards for Agent */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          title="Incoming Ships"
          value={stats.assignedCount}
          subtitle="Destination port arrivals"
          icon={Ship}
          accent="navy"
          trend="Inbound"
          trendType="up"
          onClick={() => onNavigate('agent-shipments')}
        />
        <StatCard
          title="Hold Cargo"
          value={stats.holdCount}
          subtitle={stats.holdCount > 0 ? "Document release restricted" : "No holds"}
          icon={AlertTriangle}
          accent="warning"
          trend={stats.holdCount > 0 ? "Hold Active" : "Clear"}
          trendType={stats.holdCount > 0 ? "down" : "up"}
          onClick={() => onNavigate('agent-documents')}
        />
        <StatCard
          title="Ready Documents"
          value={stats.documentsCount}
          subtitle="Bills of Lading & Manifests"
          icon={FileStack}
          accent="cyan"
          trend="Available"
          trendType="up"
          onClick={() => onNavigate('agent-documents')}
        />
        <StatCard
          title="Cargo Volume"
          value={
            Number(stats.totalCbm) > 0
              ? `${stats.totalCbm} CBM`
              : (Number(stats.totalCft) > 0 ? `${stats.totalCft} CFT` : '0.00 CBM')
          }
          subtitle={
            stats.totalPackages > 0
              ? `${stats.totalPackages} packages (${stats.totalCft || '0.00'} CFT)`
              : '0 packages scheduled'
          }
          icon={Package}
          accent="gold"
          trend={stats.assignedCount > 0 ? "Active Inbound" : "No Cargo"}
          trendType={stats.assignedCount > 0 ? "up" : "neutral"}
          onClick={() => onNavigate('agent-shipments')}
        />
      </div>

      {/* Main Agent Content Grid */}
      <div className="grid grid-cols-12 gap-5">
        <div style={{ gridColumn: 'span 8' }} className="col-span-8-mobile">
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: '1rem', color: '#0A192F' }}>My Inbound Assigned Shipments</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                  Consignments staged or en-route to destination port
                </p>
              </div>
              <button
                onClick={() => onNavigate('agent-shipments')}
                className="btn btn-ghost btn-sm"
              >
                <span>View All</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ padding: '0' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Shipment #</th>
                      <th>Vessel &amp; Carrier</th>
                      <th>Cargo Volume</th>
                      <th>Estimated Arrival (ETA)</th>
                      <th>B/L Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                          No inbound assigned shipments found in database.
                        </td>
                      </tr>
                    ) : (
                      shipments.map(s => (
                        <tr key={s.id || s.shipmentNumber}>
                          <td>
                            <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: '#0A192F' }}>{s.shipmentNumber}</strong>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Trk: {s.trackingNumber}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{s.vesselName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{s.carrier}</div>
                          </td>
                          <td>
                            <strong>{s.totalCbm} CBM</strong>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              {s.totalPackages} pkgs ({Number(s.totalWeightLbs || 0).toLocaleString()} lbs{s.totalCft ? ` / ${s.totalCft} CFT` : ''})
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: '#0284C7' }}>{s.eta}</strong>
                          </td>
                          <td>
                            <StatusBadge status={s.blStatus || 'Released'} />
                          </td>
                          <td>
                            <button
                              onClick={() => onNavigate('agent-bl-detail', s.billOfLadingNumber || s.billOfLadingId || s.id)}
                              className="btn btn-sm btn-outline"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              <span>B/L Access</span>
                              <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Port Notice & Head Office Contacts */}
        <div style={{ gridColumn: 'span 4' }} className="col-span-4-mobile">
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#0A192F', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={16} style={{ color: '#0284C7' }} />
              <span>Head Office Support</span>
            </h3>

            <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.45 }}>
              For hold clearance, payment confirmations, or amended manifests, please contact KERS Operations directly.
            </div>

            <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.72rem' }}>Operations Desk:</span>
                <div style={{ fontWeight: 700 }}>+1 (305) 555-KERS (5377) Ext 2</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.72rem' }}>Documentation &amp; Holds:</span>
                <div style={{ fontWeight: 700, color: '#0284C7' }}>documentation@vicustoms.com</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.72rem' }}>Terminal Dispatch:</span>
                <div style={{ fontWeight: 600 }}>Port Everglades Berth 14 Gate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
