import React from 'react';

interface ExecutionLogProps {
  execution: {
    ruleId: number;
    timestamp: number;
    success: boolean;
    returnData: string;
    gasUsed: bigint;
  };
  isNew?: boolean;
}

export default function ExecutionLog({ execution, isNew = false }: ExecutionLogProps) {
  const formatTimestamp = (timestamp: number) =>
    new Date(timestamp * 1000).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const formatGas = (gas: bigint) => {
    const n = Number(gas);
    if (n > 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n > 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className={`border-l-2 ${
      execution.success ? 'border-[var(--accent-green)]' : 'border-[var(--accent-red)]'
    } bg-[var(--bg-card)] rounded-r-xl pl-4 pr-4 py-3 ${isNew ? 'slide-in' : ''}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs mono text-[var(--text-muted)]">Rule #{execution.ruleId}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-medium mono ${
            execution.success ? 'badge-success' : 'badge-failed'
          }`}>
            {execution.success ? '✓ OK' : '✗ FAIL'}
          </span>
        </div>
        <span className="text-xs text-[var(--text-muted)] mono">
          {formatTimestamp(execution.timestamp)}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-[var(--text-muted)]">
        <span>Gas: <span className="mono text-[var(--text-secondary)]">{formatGas(execution.gasUsed)}</span></span>
        {!execution.success && execution.returnData && execution.returnData !== '0x' && (
          <span className="text-[var(--accent-red)] truncate max-w-xs">
            {execution.returnData}
          </span>
        )}
      </div>
    </div>
  );
}
