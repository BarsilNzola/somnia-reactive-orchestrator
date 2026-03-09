import React from 'react';
import { formatEther } from 'ethers';
import { EVENT_SIGNATURES } from '../utils/constants';

interface RuleCardProps {
  rule: {
    id: number;
    source: string;
    eventSig: string;
    threshold: bigint;
    target: string;
    active: boolean;
    createdAt: number;
  };
  onDeactivate: (id: number) => void;
  executionCount?: number;
}

export default function RuleCard({ rule, onDeactivate, executionCount = 0 }: RuleCardProps) {
  const getEventName = (sig: string) => {
    // Normalize to lowercase for lookup
    const normalized = sig.toLowerCase().slice(0, 10);
    return EVENT_SIGNATURES[normalized] || sig;
  };

  const formatAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  const formatThreshold = (threshold: bigint, eventSig: string) => {
    const normalized = eventSig.toLowerCase().slice(0, 10);
    if (normalized === '0x895c0188') { // APYUpdated
      return `${threshold.toString()} bps`;
    }
    try {
      return `${parseFloat(formatEther(threshold)).toLocaleString()} SOM`;
    } catch {
      return threshold.toString();
    }
  };

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className={`card card-hover ${!rule.active ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center">
            <span className="text-xs mono text-[var(--text-muted)]">#{rule.id}</span>
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)]">
              {getEventName(rule.eventSig)}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              {executionCount} execution{executionCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium mono ${
            rule.active ? 'badge-active' : 'badge-inactive'
          }`}>
            {rule.active ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-xs mb-4">
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-muted)] uppercase tracking-wider">Threshold</span>
          <span className="mono text-[var(--accent-yellow)]">
            &lt; {formatThreshold(rule.threshold, rule.eventSig)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-muted)] uppercase tracking-wider">Source</span>
          <span className="mono text-[var(--text-secondary)]">{formatAddress(rule.source)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-muted)] uppercase tracking-wider">Target</span>
          <span className="mono text-[var(--text-secondary)]">{formatAddress(rule.target)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-muted)] uppercase tracking-wider">Created</span>
          <span className="text-[var(--text-muted)]">{timeAgo(rule.createdAt)}</span>
        </div>
      </div>

      {/* Flow visualization */}
      <div className="bg-[var(--bg-primary)] rounded-lg p-3 mb-4 text-xs mono">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <span className="text-[var(--accent-blue)]">{formatAddress(rule.source)}</span>
          <span>→</span>
          <span className="text-[var(--accent-yellow)]">{getEventName(rule.eventSig)}</span>
          <span>→</span>
          <span className="text-[var(--accent-green)]">{formatAddress(rule.target)}</span>
        </div>
      </div>

      {rule.active && (
        <button
          onClick={() => onDeactivate(rule.id)}
          className="w-full py-2 text-xs text-[var(--accent-red)] border border-[rgba(239,68,68,0.2)] rounded-lg hover:bg-[rgba(239,68,68,0.08)] transition-all"
        >
          Deactivate Rule
        </button>
      )}
    </div>
  );
}
