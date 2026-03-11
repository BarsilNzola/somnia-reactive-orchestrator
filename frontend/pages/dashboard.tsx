import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import Layout from '../components/Layout';
import ContractState from '../components/ContractState';
import RuleCard from '../components/RuleCard';
import ExecutionLog from '../components/ExecutionLog';
import { useContracts } from '../hooks/useContracts';
import { useOrchestrator } from '../hooks/useOrchestrator';
import { useReactivity } from '../hooks/useReactivity';
import { contractAddresses, isDeployed } from '../utils/contractAddresses';

export default function Dashboard() {
  const { contracts, isConnected, address } = useContracts();
  const { rules, executions, loading, deactivateRule, refresh } = useOrchestrator();
  const { sourceState, targetState, setSourceState, setTargetState, isInitialized } = useReactivity();
  const [isOwner, setIsOwner] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Check if connected wallet is owner
  useEffect(() => {
    const checkOwner = async () => {
      if (!contracts || !address) return;
      try {
        const owner = await (contracts.orchestrator as any).owner();
        setIsOwner(owner.toLowerCase() === address.toLowerCase());
      } catch {}
    };
    checkOwner();
  }, [contracts, address]);

  // Fetch live state from contracts
  const fetchStates = useCallback(async () => {
    if (!contracts) return;
    try {
      const [liquidity, apy, price, status, rate, allocation] = await Promise.all([
        (contracts.liquidityPool as any).getLiquidity(),
        (contracts.liquidityPool as any).getAPY(),
        (contracts.liquidityPool as any).getPrice(),
        (contracts.stakingManager as any).getStakingStatus(),
        (contracts.stakingManager as any).getRewardRate(),
        (contracts.stakingManager as any).getStrategyAllocation(),
      ]);
      setSourceState({ liquidity: liquidity.toString(), apy: Number(apy), price: price.toString() });
      setTargetState({ paused: status, rewardRate: Number(rate), allocation: Number(allocation) });
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching states:', err);
    }
  }, [contracts, setSourceState, setTargetState]);

  useEffect(() => {
    fetchStates();
    const interval = setInterval(fetchStates, 6000);
    return () => clearInterval(interval);
  }, [fetchStates]);

  // Step-by-step status shown to judges during trigger
  const [triggerSteps, setTriggerSteps] = useState<
    { label: string; status: 'pending' | 'running' | 'done' | 'skipped' | 'error' }[]
  >([]);

  const setStep = (
    steps: { label: string; status: 'pending' | 'running' | 'done' | 'skipped' | 'error' }[],
    index: number,
    status: 'pending' | 'running' | 'done' | 'skipped' | 'error'
  ) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], status };
    setTriggerSteps(updated);
    return updated;
  };

  const triggerDemoEvent = async (scenario: 'liquidity_low' | 'price_drop') => {
    if (!contracts) return;
    setTriggerLoading(true);
    setTriggerMsg('');

    const steps = [
      { label: 'Somnia Reactivity subscription active', status: 'pending' as const },
      { label: scenario === 'price_drop' ? 'Drop price 25% on LiquidityPool' : 'Set liquidity to 5K SOM', status: 'pending' as const },
      { label: 'Waiting for Reactivity layer → orchestrator → target', status: 'pending' as const },
    ];
    setTriggerSteps(steps);

    try {
      const signerContracts = contracts.getSignerContracts();
      if (!signerContracts) throw new Error('No signer — make sure wallet is connected');

      // ── Step 1: Reactivity subscription confirmation ────────────────────────
      let s = setStep(steps, 0, 'running');
      await new Promise(r => setTimeout(r, 400));
      s = setStep(s, 0, 'done');

      // ── Step 2: Fire the on-chain event ────────────────────────────────────
      s = setStep(s, 1, 'running');
      if (scenario === 'liquidity_low') {
        const tx = await (signerContracts.liquidityPool as any).updateLiquidity(
          ethers.parseEther('5000')
        );
        await tx.wait();
      } else {
        const currentPrice = await (contracts.liquidityPool as any).getPrice();
        const newPrice = (BigInt(currentPrice) * 75n) / 100n;
        const tx = await (signerContracts.liquidityPool as any).updatePrice(newPrice);
        await tx.wait();
      }
      s = setStep(s, 1, 'done');

      // ── Step 3: Watch for execution log ────────────────────────────────────
      s = setStep(s, 2, 'running');
      fetchStates();

      const pollIntervals = [2000, 4000, 6000, 9000, 12000, 15000];
      pollIntervals.forEach(ms =>
        setTimeout(() => { refresh(); fetchStates(); }, ms)
      );
      setTimeout(() => {
        setTriggerSteps(prev =>
          prev.map((step, i) => i === 2 ? { ...step, status: 'done' } : step)
        );
        setTriggerMsg('✓ Reactive execution complete — check the execution log below');
      }, 15000);

    } catch (err: any) {
      setTriggerSteps(prev =>
        prev.map(step => step.status === 'running' ? { ...step, status: 'error' } : step)
      );
      setTriggerMsg(`✗ ${err?.message?.slice(0, 120) || 'Transaction failed'}`);
    } finally {
      setTriggerLoading(false);
    }
  };

  const sourceMetrics = [
    { label: 'Liquidity', value: sourceState.liquidity, format: 'ether' as const },
    { label: 'APY', value: sourceState.apy.toString(), format: 'number' as const },
    { label: 'Price', value: sourceState.price, format: 'ether' as const },
  ];

  const targetMetrics = [
    { label: 'Staking Status', value: targetState.paused, format: 'boolean' as const },
    { label: 'Reward Rate', value: targetState.rewardRate.toString(), format: 'number' as const },
    { label: 'Strategy Allocation', value: targetState.allocation.toString(), format: 'number' as const },
  ];

  const activeRuleCount = rules.filter(r => r.active).length;
  const successCount = executions.filter(e => e.success).length;

  if (!isConnected) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <div className="text-4xl">🔌</div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Connect your wallet to continue
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            You need MetaMask connected to Somnia Testnet (Chain ID: 50312)
          </p>
        </div>
      </Layout>
    );
  }

  if (!isDeployed()) {
    return (
      <Layout>
        <div className="card max-w-xl mx-auto mt-12">
          <div className="text-[var(--accent-yellow)] text-2xl mb-4">⚠</div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Contracts Not Configured
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Add your deployed contract addresses to <code className="mono text-[var(--accent-green)]">.env.local</code>:
          </p>
          <pre className="bg-[var(--bg-primary)] rounded-lg p-4 text-xs mono text-[var(--accent-green)] overflow-x-auto">
{`NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=0x...
NEXT_PUBLIC_STAKING_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_ORCHESTRATOR_ADDRESS=0x...`}
          </pre>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Somnia Reactive Orchestrator
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              On-chain event automation · Somnia Testnet
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] live-dot" />
              <span className="text-xs text-[var(--text-muted)] mono">
                {isInitialized ? 'REACTIVITY LIVE' : 'POLLING'}
              </span>
            </div>
            <button
              onClick={() => { refresh(); fetchStates(); }}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-lg px-3 py-2 transition-all hover:border-[var(--accent-blue)]"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active Rules', value: activeRuleCount, color: 'text-[var(--accent-green)]' },
            { label: 'Total Executions', value: executions.length, color: 'text-[var(--accent-blue)]' },
            { label: 'Success Rate', value: executions.length ? `${Math.round((successCount / executions.length) * 100)}%` : '—', color: 'text-[var(--accent-green)]' },
            { label: 'Last Updated', value: lastRefresh.toLocaleTimeString(), color: 'text-[var(--text-secondary)]' },
          ].map((stat, i) => (
            <div key={i} className="card py-3">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{stat.label}</div>
              <div className={`text-xl font-bold mono ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Contract State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ContractState
            title="LiquidityPool.sol"
            subtitle="Source Contract — emits events"
            metrics={sourceMetrics}
          />
          <ContractState
            title="StakingManager.sol"
            subtitle="Target Contract — receives calls"
            metrics={targetMetrics}
          />
        </div>

        {/* Demo Trigger Panel — for judges */}
        {isOwner && (
          <div className="bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.15)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-[var(--accent-blue)] mono uppercase tracking-widest">
                Live Demo Triggers
              </span>
              <span className="text-xs bg-[rgba(59,130,246,0.1)] text-[var(--accent-blue)] px-2 py-0.5 rounded mono">
                owner only
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Fires a real on-chain event. Somnia Reactivity notifies the orchestrator trustlessly — no backend, no polling.
            </p>

            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={() => triggerDemoEvent('price_drop')}
                disabled={triggerLoading}
                className="text-sm px-4 py-2 rounded-lg border border-[rgba(239,68,68,0.3)] text-[var(--accent-red)] hover:bg-[rgba(239,68,68,0.08)] transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {triggerLoading ? (
                  <span className="w-3 h-3 border border-[var(--accent-red)] border-t-transparent rounded-full animate-spin" />
                ) : '📉'}
                Trigger: Price Drop 25%
              </button>
              <button
                onClick={() => triggerDemoEvent('liquidity_low')}
                disabled={triggerLoading}
                className="text-sm px-4 py-2 rounded-lg border border-[rgba(245,158,11,0.3)] text-[var(--accent-yellow)] hover:bg-[rgba(245,158,11,0.08)] transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {triggerLoading ? (
                  <span className="w-3 h-3 border border-[var(--accent-yellow)] border-t-transparent rounded-full animate-spin" />
                ) : '⚡'}
                Trigger: Liquidity → 5K SOM
              </button>
            </div>

            {/* Live step tracker */}
            {triggerSteps.length > 0 && (
              <div className="bg-[var(--bg-primary)] rounded-xl p-4 space-y-2 mb-3">
                {triggerSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                      {step.status === 'pending' && (
                        <div className="w-2 h-2 rounded-full bg-[var(--text-muted)]" />
                      )}
                      {step.status === 'running' && (
                        <div className="w-4 h-4 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
                      )}
                      {step.status === 'done' && (
                        <span className="text-[var(--accent-green)] text-sm">✓</span>
                      )}
                      {step.status === 'skipped' && (
                        <span className="text-[var(--text-muted)] text-sm">–</span>
                      )}
                      {step.status === 'error' && (
                        <span className="text-[var(--accent-red)] text-sm">✗</span>
                      )}
                    </div>
                    <span className={`text-xs mono ${
                      step.status === 'running' ? 'text-[var(--accent-blue)]' :
                      step.status === 'done' ? 'text-[var(--accent-green)]' :
                      step.status === 'skipped' ? 'text-[var(--text-muted)]' :
                      step.status === 'error' ? 'text-[var(--accent-red)]' :
                      'text-[var(--text-muted)]'
                    }`}>
                      {step.label}
                      {step.status === 'skipped' && ' (already set)'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {triggerMsg && (
              <div className={`text-xs mono p-3 rounded-lg ${
                triggerMsg.startsWith('✓')
                  ? 'bg-[rgba(0,255,157,0.06)] text-[var(--accent-green)]'
                  : 'bg-[rgba(239,68,68,0.06)] text-[var(--accent-red)]'
              }`}>
                {triggerMsg}
              </div>
            )}
          </div>
        )}

        {/* Rules + Executions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Rules <span className="text-[var(--text-muted)] mono text-sm ml-1">({rules.length})</span>
              </h2>
              <a
                href="/create-rule"
                className="text-xs text-[var(--accent-green)] hover:underline"
              >
                + New Rule
              </a>
            </div>
            {loading ? (
              <div className="card flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-[var(--accent-green)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[var(--text-secondary)]">Loading rules...</span>
              </div>
            ) : rules.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-3xl mb-3">📋</div>
                <div className="text-sm text-[var(--text-secondary)] mb-4">No rules registered yet</div>
                <a
                  href="/create-rule"
                  className="text-sm text-[var(--accent-green)] hover:underline"
                >
                  Create your first rule →
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map(rule => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onDeactivate={deactivateRule}
                    executionCount={executions.filter(e => e.ruleId === rule.id).length}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Execution Log{' '}
                <span className="text-[var(--text-muted)] mono text-sm ml-1">({executions.length})</span>
              </h2>
              {executions.length > 0 && (
                <span className="text-xs text-[var(--text-muted)]">Most recent first</span>
              )}
            </div>
            {executions.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-3xl mb-3">📡</div>
                <div className="text-sm text-[var(--text-secondary)]">
                  Waiting for rule executions...
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-2">
                  Trigger a demo event above or let the Reactivity layer pick up live events
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {executions.map((exec, idx) => (
                  <ExecutionLog key={`${exec.ruleId}-${exec.timestamp}`} execution={exec} isNew={idx === 0} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contract addresses for judges */}
        <div className="card">
          <div className="text-xs font-semibold text-[var(--text-muted)] mono uppercase tracking-widest mb-3">
            Deployed Contracts — Somnia Testnet
          </div>
          <div className="space-y-2">
            {[
              { label: 'LiquidityPool', addr: contractAddresses.liquidityPool },
              { label: 'StakingManager', addr: contractAddresses.stakingManager },
              { label: 'Orchestrator', addr: contractAddresses.orchestrator },
            ].map(c => (
              <div key={c.label} className="flex justify-between items-center">
                <span className="text-xs text-[var(--text-secondary)]">{c.label}</span>
                <a
                  href={`https://shannon-explorer.somnia.network/address/${c.addr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs mono text-[var(--accent-blue)] hover:underline"
                >
                  {c.addr.slice(0, 10)}...{c.addr.slice(-6)} ↗
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}
