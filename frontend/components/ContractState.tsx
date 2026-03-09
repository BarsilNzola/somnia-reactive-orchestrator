import React from 'react';
import { formatEther } from 'ethers';

interface ContractStateProps {
  title: string;
  subtitle?: string;
  live?: boolean;
  metrics: {
    label: string;
    value: string | number | boolean;
    format?: 'ether' | 'number' | 'boolean';
    highlight?: boolean;
  }[];
}

export default function ContractState({ title, subtitle, live = true, metrics }: ContractStateProps) {
  const formatValue = (value: string | number | boolean, format?: 'ether' | 'number' | 'boolean') => {
    if (format === 'ether' && typeof value === 'string') {
      try {
        return `${parseFloat(formatEther(value)).toLocaleString()} SOM`;
      } catch {
        return '0 SOM';
      }
    }
    if (format === 'boolean' && typeof value === 'boolean') {
      return value ? 'Paused' : 'Active';
    }
    return value.toString();
  };

  const getValueColor = (value: string | number | boolean, format?: 'ether' | 'number' | 'boolean') => {
    if (format === 'boolean') {
      return typeof value === 'boolean' && value
        ? 'text-[var(--accent-red)]'
        : 'text-[var(--accent-green)]';
    }
    return 'text-[var(--text-primary)]';
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
        {live && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] live-dot" />
            <span className="text-xs text-[var(--text-muted)] mono">LIVE</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {metrics.map((metric, index) => (
          <div key={index} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
            <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">
              {metric.label}
            </span>
            <span className={`text-sm font-medium mono ${getValueColor(metric.value, metric.format)}`}>
              {formatValue(metric.value, metric.format)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}