import React from 'react';
import { ChevronRight } from 'lucide-react';

export const Breadcrumbs = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#64748B', marginBottom: '0.4rem' }} aria-label="Breadcrumb">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {item.href ? (
              <a href={item.href} style={{ color: '#64748B', textDecoration: 'none' }} className="breadcrumb-link">
                {item.label}
              </a>
            ) : (
              <span style={{ color: isLast ? '#0A192F' : '#64748B', fontWeight: isLast ? 600 : 400 }}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight size={12} style={{ color: '#94A3B8' }} />}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  breadcrumbs = [],
  actions,
  action
}) => {
  const headerActions = actions || action;
  return (
    <div className="page-header">
      <div className="page-header-title">
        {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
        <h1>
          {Icon && <Icon size={24} style={{ color: '#0284C7', flexShrink: 0 }} />}
          <span>{title}</span>
        </h1>
        {subtitle && <div className="page-header-desc">{subtitle}</div>}
      </div>

      {headerActions && (
        <div className="page-header-actions">
          {headerActions}
        </div>
      )}
    </div>
  );
};
