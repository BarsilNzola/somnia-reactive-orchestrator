import React, { useState } from 'react';
import { contractAddresses } from '../utils/contractAddresses';
import { AVAILABLE_EVENTS, AVAILABLE_ACTIONS } from '../utils/constants';

interface CreateRuleFormProps {
  onSubmit: (data: {
    source: string;
    eventSig: string;
    threshold: bigint;
    target: string;
    callData: string;
  }) => Promise<void>;
  loading: boolean;
}

type ThresholdPreset = 'low' | 'medium' | 'high' | 'custom';

export default function CreateRuleForm({ onSubmit, loading }: CreateRuleFormProps) {
  const [source, setSource] = useState(contractAddresses.liquidityPool);
  const [eventSig, setEventSig] = useState(AVAILABLE_EVENTS[0].sig);
  const [thresholdPreset, setThresholdPreset] = useState<ThresholdPreset>('medium');
  const [customThreshold, setCustomThreshold] = useState('');
  const [target, setTarget] = useState(contractAddresses.stakingManager);
  const [actionCallData, setActionCallData] = useState(AVAILABLE_ACTIONS[0].callData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const THRESHOLD_PRESETS: Record<string, Record<ThresholdPreset, string>> = {
    '0xf1f86f8f': { // LiquidityUpdated — Rule 0 default: 10,000 SOM
      low: (1000n * 10n ** 18n).toString(),
      medium: (10000n * 10n ** 18n).toString(),
      high: (100000n * 10n ** 18n).toString(),
      custom: ''
    },
    '0x787a1fca': { // APYUpdated — Rule 2 default: 300 bps
      low: '100',
      medium: '300',
      high: '1000',
      custom: ''
    },
    '0x7bb53a16': { // OraclePriceUpdated — Rule 1 default: 80 SOM
      low: (14n * 10n ** 18n).toString(),
      medium: (80n * 10n ** 18n).toString(),
      high: (200n * 10n ** 18n).toString(),
      custom: ''
    }
  };

  const getThresholdValue = (): bigint => {
    if (thresholdPreset === 'custom') {
      try {
        return BigInt(customThreshold || '0');
      } catch {
        return 0n;
      }
    }
    const preset = THRESHOLD_PRESETS[eventSig]?.[thresholdPreset];
    return BigInt(preset || '0');
  };

  const getThresholdDisplay = (): string => {
    if (thresholdPreset === 'custom') return customThreshold;
    const preset = THRESHOLD_PRESETS[eventSig]?.[thresholdPreset];
    if (!preset) return '0';
    if (eventSig === '0xf1f86f8f' || eventSig === '0x7bb53a16') {
      return `${(BigInt(preset) / 10n ** 18n).toString()} SOM`;
    }
    return preset;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const threshold = getThresholdValue();
    if (threshold === 0n) {
      setError('Please set a valid threshold value');
      return;
    }

    try {
      await onSubmit({
        source,
        eventSig,
        threshold,
        target,
        callData: actionCallData,
      });
      setSuccess('Rule created successfully! Redirecting...');
    } catch (err: any) {
      setError(err?.message || 'Failed to create rule. Check console for details.');
    }
  };

  const selectedEvent = AVAILABLE_EVENTS.find(e => e.sig === eventSig);
  const selectedAction = AVAILABLE_ACTIONS.find(a => a.callData === actionCallData);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Source Contract */}
      <div className="card">
        <h3 className="text-sm font-semibold text-[var(--accent-green)] uppercase tracking-widest mb-4 mono">
          01 / Source Contract
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Contract Address</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSource(contractAddresses.liquidityPool)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-all ${
                  source === contractAddresses.liquidityPool
                    ? 'border-[var(--accent-green)] bg-[rgba(0,255,157,0.08)] text-[var(--accent-green)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]'
                }`}
              >
                LiquidityPool
              </button>
              <button
                type="button"
                onClick={() => setSource(contractAddresses.orchestrator)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-all ${
                  source === contractAddresses.orchestrator
                    ? 'border-[var(--accent-green)] bg-[rgba(0,255,157,0.08)] text-[var(--accent-green)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]'
                }`}
              >
                Orchestrator
              </button>
            </div>
            <input
              type="text"
              value={source}
              onChange={e => setSource(e.target.value)}
              className="mt-2 w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Event to Monitor</label>
            <div className="space-y-2">
              {AVAILABLE_EVENTS.map(event => (
                <button
                  key={event.sig}
                  type="button"
                  onClick={() => { setEventSig(event.sig); setThresholdPreset('medium'); }}
                  className={`w-full text-left py-3 px-4 rounded-lg border transition-all ${
                    eventSig === event.sig
                      ? 'border-[var(--accent-blue)] bg-[rgba(59,130,246,0.08)]'
                      : 'border-[var(--border)] hover:border-[var(--accent-blue)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{event.name}</span>
                    <span className="text-xs mono text-[var(--text-muted)]">{event.sig}</span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">{event.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Threshold */}
      <div className="card">
        <h3 className="text-sm font-semibold text-[var(--accent-green)] uppercase tracking-widest mb-4 mono">
          02 / Trigger Condition
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          Rule fires when <strong className="text-[var(--text-primary)]">{selectedEvent?.name}</strong> value drops below this threshold
        </p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(['low', 'medium', 'high'] as ThresholdPreset[]).map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => setThresholdPreset(preset)}
              className={`py-2 rounded-lg text-sm border capitalize transition-all ${
                thresholdPreset === preset
                  ? 'border-[var(--accent-yellow)] bg-[rgba(245,158,11,0.08)] text-[var(--accent-yellow)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-yellow)]'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setThresholdPreset('custom')}
          className={`w-full py-2 rounded-lg text-sm border mb-3 transition-all ${
            thresholdPreset === 'custom'
              ? 'border-[var(--accent-blue)] bg-[rgba(59,130,246,0.08)] text-[var(--accent-blue)]'
              : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]'
          }`}
        >
          Custom Value
        </button>
        {thresholdPreset === 'custom' ? (
          <input
            type="text"
            value={customThreshold}
            onChange={e => setCustomThreshold(e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
            placeholder="Raw value in wei (e.g. 10000000000000000000000)"
          />
        ) : (
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm mono text-[var(--accent-yellow)]">
            {getThresholdDisplay()}
          </div>
        )}
      </div>

      {/* Target Contract */}
      <div className="card">
        <h3 className="text-sm font-semibold text-[var(--accent-green)] uppercase tracking-widest mb-4 mono">
          03 / Target Action
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Target Contract</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setTarget(contractAddresses.stakingManager)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-all ${
                  target === contractAddresses.stakingManager
                    ? 'border-[var(--accent-green)] bg-[rgba(0,255,157,0.08)] text-[var(--accent-green)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]'
                }`}
              >
                StakingManager
              </button>
            </div>
            <input
              type="text"
              value={target}
              onChange={e => setTarget(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Action to Execute</label>
            <div className="space-y-2">
              {AVAILABLE_ACTIONS.map(action => (
                <button
                  key={action.callData}
                  type="button"
                  onClick={() => setActionCallData(action.callData)}
                  className={`w-full text-left py-3 px-4 rounded-lg border transition-all ${
                    actionCallData === action.callData
                      ? 'border-[var(--accent-blue)] bg-[rgba(59,130,246,0.08)]'
                      : 'border-[var(--border)] hover:border-[var(--accent-blue)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{action.name}</span>
                    <span className="text-xs mono text-[var(--text-muted)]">{action.callData}</span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">{action.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rule Preview */}
      <div className="bg-[rgba(0,255,157,0.04)] border border-[rgba(0,255,157,0.15)] rounded-xl p-5">
        <div className="text-xs font-semibold text-[var(--accent-green)] uppercase tracking-widest mb-3 mono">
          Rule Preview
        </div>
        <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
          When <span className="text-[var(--accent-blue)] font-medium">{selectedEvent?.name}</span> on{' '}
          <span className="mono text-[var(--text-primary)]">
            {source.slice(0, 6)}...{source.slice(-4)}
          </span>{' '}
          drops below{' '}
          <span className="text-[var(--accent-yellow)] font-medium">{getThresholdDisplay()}</span>,
          automatically call{' '}
          <span className="text-[var(--accent-green)] font-medium">{selectedAction?.name}</span> on{' '}
          <span className="mono text-[var(--text-primary)]">
            {target.slice(0, 6)}...{target.slice(-4)}
          </span>
        </div>
      </div>

      {/* Errors / Success */}
      {error && (
        <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-lg px-4 py-3 text-sm text-[var(--accent-red)]">
          ⚠ {error}
        </div>
      )}
      {success && (
        <div className="bg-[rgba(0,255,157,0.08)] border border-[rgba(0,255,157,0.2)] rounded-lg px-4 py-3 text-sm text-[var(--accent-green)]">
          ✓ {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all
          bg-[var(--accent-green)] text-[var(--bg-primary)]
          hover:bg-[rgba(0,255,157,0.85)] 
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Creating Rule...
          </span>
        ) : 'Register Rule On-Chain'}
      </button>
    </form>
  );
}
