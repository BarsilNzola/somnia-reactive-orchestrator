import React from 'react';
import Link from 'next/link';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { isDeployed } from '../utils/contractAddresses';

export default function Home() {
  const { isConnected } = useAccount();
  const { connect } = useConnect();

  const features = [
    {
      icon: '⚡',
      title: 'Native On-Chain Reactivity',
      desc: 'Powered by Somnia Reactivity SDK — no polling, no bots, no off-chain infrastructure',
    },
    {
      icon: '🔗',
      title: 'Cross-Contract Orchestration',
      desc: 'Subscribe to events from any contract and automatically trigger actions on another',
    },
    {
      icon: '🛡',
      title: 'Trustless Automation',
      desc: 'Rules execute deterministically on-chain. No admin keys. No centralized relayers.',
    },
    {
      icon: '📊',
      title: 'Live Execution Logs',
      desc: 'Every triggered rule is logged on-chain with timestamp, gas used, and result',
    },
  ];

  const scenarios = [
    {
      trigger: 'Liquidity < 10,000 SOM',
      action: 'pauseStaking()',
      status: 'demo',
      label: 'LP Risk Guardian',
    },
    {
      trigger: 'Price drops 20%',
      action: 'rebalanceStrategy()',
      status: 'demo',
      label: 'Oracle Rebalancer',
    },
    {
      trigger: 'APY < 500 bps',
      action: 'updateRewardRate()',
      status: 'demo',
      label: 'Yield Optimizer',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] grid-bg">
      {/* Nav */}
      <nav className="border-b border-[var(--border)] bg-[rgba(10,14,26,0.8)] backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-green)] flex items-center justify-center">
              <span className="text-[var(--bg-primary)] text-xs font-bold mono">S</span>
            </div>
            <span className="font-semibold text-[var(--text-primary)] mono text-sm">
              Somnia Reactive Orchestrator
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Dashboard
            </Link>
            {!isConnected ? (
              <button
                onClick={() => connect({ connector: injected() })}
                className="bg-[var(--accent-green)] text-[var(--bg-primary)] px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Connect Wallet
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="bg-[var(--accent-green)] text-[var(--bg-primary)] px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Open App →
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[rgba(0,255,157,0.08)] border border-[rgba(0,255,157,0.15)] rounded-full px-4 py-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] live-dot" />
            <span className="text-xs text-[var(--accent-green)] mono font-medium">
              Live on Somnia Testnet
            </span>
          </div>

          <h1 className="text-5xl font-bold text-[var(--text-primary)] leading-tight mb-6">
            On-Chain Automation
            <br />
            <span className="text-[var(--accent-green)]">Without the Bots</span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-10">
            SRO is a trustless, composable automation engine powered by Somnia Native Reactivity.
            Define rules. Deploy once. Smart contracts react to each other in real time.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="bg-[var(--accent-green)] text-[var(--bg-primary)] px-8 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Open Dashboard
            </Link>
            <Link
              href="/create-rule"
              className="border border-[var(--border)] text-[var(--text-primary)] px-8 py-3 rounded-xl text-sm font-medium hover:border-[var(--accent-blue)] transition-colors"
            >
              Create Rule
            </Link>
          </div>

          {!isDeployed() && (
            <div className="mt-6 bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-lg px-4 py-3 text-xs text-[var(--accent-yellow)] mono">
              ⚠ Contract addresses not set — update NEXT_PUBLIC_* env vars after deployment
            </div>
          )}
        </div>
      </div>

      {/* Live Scenario Flow */}
      <div className="max-w-6xl mx-auto px-6 py-16 border-t border-[var(--border)]">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">How It Works</h2>
          <p className="text-[var(--text-secondary)] text-sm">
            Traditional dApps rely on bots or polling. SRO uses native on-chain reactivity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {scenarios.map((s, i) => (
            <div key={i} className="card card-hover">
              <div className="text-xs font-semibold text-[var(--accent-green)] mono uppercase tracking-widest mb-3">
                {s.label}
              </div>
              <div className="space-y-3">
                <div className="bg-[var(--bg-primary)] rounded-lg p-3">
                  <div className="text-xs text-[var(--text-muted)] mb-1">TRIGGER</div>
                  <div className="text-sm mono text-[var(--accent-yellow)]">{s.trigger}</div>
                </div>
                <div className="flex justify-center text-[var(--text-muted)]">↓</div>
                <div className="bg-[var(--bg-primary)] rounded-lg p-3">
                  <div className="text-xs text-[var(--text-muted)] mb-1">EXECUTE</div>
                  <div className="text-sm mono text-[var(--accent-green)]">{s.action}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] live-dot" />
                <span className="text-xs text-[var(--text-muted)]">No backend · No polling · Trustless</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-16 border-t border-[var(--border)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div key={i} className="card">
              <div className="text-2xl mb-4">{f.icon}</div>
              <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">{f.title}</div>
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture */}
      <div className="max-w-6xl mx-auto px-6 py-16 border-t border-[var(--border)]">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8 text-center">Architecture</h2>
        <div className="card max-w-2xl mx-auto">
          <div className="space-y-2 mono text-sm">
            {[
              { label: 'Source Contract', color: 'text-[var(--accent-blue)]', note: 'emits events' },
              { label: '↓', color: 'text-[var(--text-muted)]', note: '' },
              { label: 'Somnia Reactivity Layer', color: 'text-[var(--accent-green)]', note: 'native, no polling' },
              { label: '↓', color: 'text-[var(--text-muted)]', note: '' },
              { label: 'Reactive Orchestrator', color: 'text-[var(--accent-yellow)]', note: 'evaluates rules' },
              { label: '↓', color: 'text-[var(--text-muted)]', note: '' },
              { label: 'Target Contract', color: 'text-[var(--accent-blue)]', note: 'executes action' },
              { label: '↓', color: 'text-[var(--text-muted)]', note: '' },
              { label: 'Frontend UI', color: 'text-[var(--accent-green)]', note: 'instant update' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className={row.color}>{row.label}</span>
                {row.note && <span className="text-xs text-[var(--text-muted)]">// {row.note}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)] mono">
            Somnia Reactive Orchestrator · Somnia Reactivity Mini Hackathon 2026
          </span>
          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <a href="https://docs.somnia.network/developer/reactivity" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-secondary)]">
              Docs
            </a>
            <a href="https://x.com/SomniaDevs" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-secondary)]">
              X / Twitter
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
