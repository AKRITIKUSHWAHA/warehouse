import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox, Filter, Plus } from 'lucide-react';

export const ResponsiveTable = ({
  columns = [],
  data = [],
  searchable = true,
  searchPlaceholder = "Search records...",
  filterOptions = [],
  pageSize = 8,
  emptyTitle,
  emptyMessage,
  emptySubtext,
  emptyWhy,
  emptyNextStep,
  emptyActionLabel,
  onEmptyAction,
  onRowClick,
  keyExtractor = (item, idx) => item.id || idx,
  customFilterBar
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        return Object.values(item).some(val => {
          if (typeof val === 'string' || typeof val === 'number') {
            return String(val).toLowerCase().includes(q);
          }
          if (typeof val === 'object' && val !== null) {
            return Object.values(val).some(nestedVal =>
              String(nestedVal).toLowerCase().includes(q)
            );
          }
          return false;
        });
      });
    }

    if (activeFilter !== 'All') {
      const filterLower = activeFilter.toLowerCase();
      result = result.filter(item => {
        // 1. Direct standard field matches
        if (
          item.status === activeFilter ||
          item.destinationCode === activeFilter ||
          item.type === activeFilter ||
          item.agentId === activeFilter
        ) {
          return true;
        }

        // Status flexible matching (e.g. Delivered matching "Delivered / Released")
        if (item.status) {
          const statusLower = String(item.status).toLowerCase();
          if (statusLower === filterLower) return true;
          if (filterLower === 'delivered' && statusLower.includes('deliver')) return true;
          if (filterLower.includes('transit') && statusLower.includes('transit')) return true;
          if (filterLower.includes('loaded') && statusLower.includes('loaded')) return true;
        }

        // 2. Module / Category matching (System Audit Trail, Activity Logs, etc.)
        if (item.module) {
          const modLower = String(item.module).toLowerCase();
          if (modLower === filterLower) return true;
          if (filterLower.includes('manifest') && modLower.includes('manifest')) return true;
          if (filterLower.includes('agent') && modLower.includes('agent')) return true;
          if (filterLower.includes('bill') && modLower.includes('bill')) return true;
          if (filterLower.includes('warehouse') && modLower.includes('warehouse')) return true;
          if (filterLower.includes('consolidation') && modLower.includes('consolidation')) return true;
        }

        // 3. Fallback: check if active filter matches action or category
        if (item.action && String(item.action).toLowerCase().includes(filterLower)) {
          return true;
        }

        return false;
      });
    }

    return result;
  }, [data, searchQuery, activeFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="table-container">
      {/* Top Filter & Search Bar */}
      {(searchable || filterOptions.length > 0 || customFilterBar) && (
        <div className="table-filter-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0, width: '100%', flexWrap: 'wrap' }}>
            {searchable && (
              <div className="input-with-icon" style={{ maxWidth: '360px', width: '100%' }}>
                <Search size={16} className="input-icon-left" />
                <input
                  type="text"
                  className="form-control"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}

            {filterOptions.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', maxWidth: '100%' }}>
                <Filter size={14} style={{ color: '#94A3B8' }} />
                {filterOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      setActiveFilter(opt);
                      setCurrentPage(1);
                    }}
                    className={`btn btn-sm ${activeFilter === opt ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {customFilterBar && (
            <div>{customFilterBar}</div>
          )}
        </div>
      )}

      {/* Table Content */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    textAlign: col.align || 'left',
                    width: col.width || 'auto',
                    minWidth: col.minWidth || 'auto'
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, rowIdx) => (
                <tr
                  key={keyExtractor(item, rowIdx)}
                  onClick={() => onRowClick && onRowClick(item)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      style={{
                        textAlign: col.align || 'left',
                        whiteSpace: col.noWrap ? 'nowrap' : 'normal'
                      }}
                    >
                      {col.render ? col.render(item, (currentPage - 1) * pageSize + rowIdx) : item[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', maxWidth: '440px', margin: '0 auto', color: '#64748B' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                      <Inbox size={26} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0A192F' }}>
                      {emptyTitle || emptyMessage || "No records found"}
                    </div>
                    {(emptyWhy || emptySubtext) && (
                      <div style={{ fontSize: '0.825rem', color: '#64748B', lineHeight: 1.4 }}>
                        {emptyWhy || emptySubtext}
                      </div>
                    )}
                    {emptyNextStep && (
                      <div style={{ fontSize: '0.8rem', color: '#0284C7', fontWeight: 600, background: '#F0F9FF', padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid #BAE6FD' }}>
                        💡 Next step: {emptyNextStep}
                      </div>
                    )}
                    {emptyActionLabel && onEmptyAction && (
                      <button
                        type="button"
                        onClick={onEmptyAction}
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: '0.4rem', gap: '4px' }}
                      >
                        <Plus size={14} />
                        <span>{emptyActionLabel}</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredData.length > 0 && (
        <div className="table-pagination">
          <div>
            Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, filteredData.length)}</strong> of <strong>{filteredData.length}</strong> entries
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-sm btn-outline"
              style={{ padding: '0.25rem 0.5rem' }}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ padding: '0 0.5rem', fontWeight: 600, fontSize: '0.8rem' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-sm btn-outline"
              style={{ padding: '0.25rem 0.5rem' }}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
