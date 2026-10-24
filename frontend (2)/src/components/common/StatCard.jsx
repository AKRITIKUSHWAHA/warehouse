import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'neutral', // 'up' | 'down' | 'neutral'
  accent = 'navy', // 'navy' | 'gold' | 'warning' | 'cyan' | 'success'
  onClick
}) => {
  return (
    <div
      className={`stat-card accent-${accent} ${onClick ? 'card-clickable' : ''}`}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: '0.75rem 0.95rem'
      }}
    >
      <div className="stat-card-top" style={{ marginBottom: '0.35rem' }}>
        <span className="stat-card-title" style={{ fontSize: '0.7rem' }}>{title}</span>
        {Icon && (
          <div className="stat-card-icon" style={{ width: '30px', height: '30px' }}>
            <Icon size={16} />
          </div>
        )}
      </div>

      <div>
        <div className="stat-card-value" style={{ fontSize: '1.35rem', marginBottom: '0.15rem' }}>{value}</div>
        <div className="stat-card-meta" style={{ fontSize: '0.72rem' }}>
          {trend && (
            <span className={`stat-card-trend ${trendType}`}>
              {trendType === 'up' && <ArrowUpRight size={13} />}
              {trendType === 'down' && <ArrowDownRight size={13} />}
              {trendType === 'neutral' && <Minus size={13} />}
              {trend}
            </span>
          )}
          {subtitle && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</span>}
        </div>
      </div>
    </div>
  );
};
