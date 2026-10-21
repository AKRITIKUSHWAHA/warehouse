import React, { useState, useEffect } from 'react';
import { Search, X, Package, FileText, Ship, Box, Users, Building2, ArrowRight } from 'lucide-react';
import { searchService } from '../../services';

// Helper to format any destination code or string into full readable name
const formatFullDestination = (dest) => {
  if (!dest) return '';
  return String(dest).trim();
};

export const QuickSearchModal = ({ isOpen, onClose, onSelectResult }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ customers: [], houseBills: [], shipments: [], receipts: [], bls: [], agents: [] });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ customers: [], houseBills: [], shipments: [], receipts: [], bls: [], containers: [], agents: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchService.search(query);
      setResults(res);
      setIsSearching(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const hasResults = Object.values(results).some(arr => arr.length > 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()} style={{ marginTop: '5vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', gap: '0.75rem' }}>
          <Search size={20} style={{ color: '#0284C7' }} />
          <input
            type="text"
            placeholder="Search Customers, House B/Ls, Shipments, Master B/Ls, WRs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1.05rem',
              color: '#0A192F',
              fontFamily: 'inherit'
            }}
          />
          <span style={{ fontSize: '0.75rem', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', color: '#64748B' }}>ESC</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close search">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1.25rem' }}>
          {query.trim().length < 2 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                Global Freight Search
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                Type at least 2 characters to search across Customer Profiles, House B/Ls, Warehouse Receipts, Shipments, and Master B/Ls.
              </div>
            </div>
          ) : !hasResults ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B' }}>
              No matches found for "{query}".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Customers */}
              {results.customers?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building2 size={14} /> Customer Profiles ({results.customers.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {results.customers.map(c => (
                      <div
                        key={c.id}
                        onClick={() => { onSelectResult('customers', c.id); onClose(); }}
                        style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        className="card-hover"
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#0A192F', fontSize: '0.875rem' }}>{c.name} • {c.customerNumber || c.id}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Destination: {formatFullDestination(c.destinationPort || c.destinationCode)} | Contact: {c.contactPerson} ({c.telephone || c.phone})</div>
                        </div>
                        <ArrowRight size={16} style={{ color: '#94A3B8' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* House Bills of Lading */}
              {results.houseBills?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileText size={14} /> House Bills of Lading (HBL) ({results.houseBills.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {results.houseBills.map(h => (
                      <div
                        key={h.id}
                        onClick={() => { onSelectResult('house-bills', h.id); onClose(); }}
                        style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        className="card-hover"
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#0A192F', fontSize: '0.875rem' }}>{h.hblNumber} • {h.customerName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Cargo: {h.cargoDescription} | Status: {h.status} | Destination: {formatFullDestination(h.destinationPort || h.destinationCode)}</div>
                        </div>
                        <ArrowRight size={16} style={{ color: '#94A3B8' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipments */}
              {results.shipments?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Ship size={14} /> Shipments ({results.shipments.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {results.shipments.map(s => (
                      <div
                        key={s.id}
                        onClick={() => { onSelectResult('shipments', s.id); onClose(); }}
                        style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        className="card-hover"
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#0A192F', fontSize: '0.875rem' }}>{s.shipmentNumber} • {formatFullDestination(s.destinationPort)}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Tracking: {s.trackingNumber} | Vessel: {s.vesselName} | Status: {s.status}</div>
                        </div>
                        <ArrowRight size={16} style={{ color: '#94A3B8' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warehouse Receipts */}
              {results.receipts?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Package size={14} /> Warehouse Receipts ({results.receipts.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {results.receipts.map(r => (
                      <div
                        key={r.id}
                        onClick={() => { onSelectResult('warehouse-receipts', r.id); onClose(); }}
                        style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        className="card-hover"
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#0A192F', fontSize: '0.875rem' }}>{r.receiptNumber} • {r.customer}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{r.packageCount} {r.packageType} | {r.cbm} CBM | Destination: {formatFullDestination(r.destinationPort || r.destinationCode)}</div>
                        </div>
                        <ArrowRight size={16} style={{ color: '#94A3B8' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bills of Lading */}
              {results.bls?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileText size={14} /> Master Bills of Lading ({results.bls.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {results.bls.map(b => (
                      <div
                        key={b.id}
                        onClick={() => { onSelectResult('bills-of-lading', b.id); onClose(); }}
                        style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        className="card-hover"
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#0A192F', fontSize: '0.875rem' }}>{b.blNumber} • {b.consignee?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Status: {b.status} | Vessel: {b.oceanVessel} | Weight: {b.grossWeightLbs} lbs</div>
                        </div>
                        <ArrowRight size={16} style={{ color: '#94A3B8' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* Agents */}
              {results.agents?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={14} /> Port Agents ({results.agents.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {results.agents.map(a => (
                      <div
                        key={a.id}
                        onClick={() => { onSelectResult('agents', a.id); onClose(); }}
                        style={{ padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        className="card-hover"
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#0A192F', fontSize: '0.875rem' }}>{a.name} ({a.agentCode})</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Territory: {a.territory} | Contact: {a.contactPerson}</div>
                        </div>
                        <ArrowRight size={16} style={{ color: '#94A3B8' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
