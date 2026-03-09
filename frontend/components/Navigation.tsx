import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export default function Navigation() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/create-rule', label: 'Create Rule' },
  ];

  return (
    <nav className="bg-[rgba(10,14,26,0.95)] border-b border-[var(--border)] backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent-green)] flex items-center justify-center">
                <span className="text-[var(--bg-primary)] text-xs font-bold mono">S</span>
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)] mono hidden sm:block">
                SRO
              </span>
            </Link>
            <div className="flex gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    router.pathname === link.href
                      ? 'bg-[rgba(0,255,157,0.08)] text-[var(--accent-green)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] live-dot" />
                  <span className="text-xs mono text-[var(--text-secondary)]">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors px-2 py-1"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => connect({ connector: injected() })}
                className="bg-[var(--accent-green)] text-[var(--bg-primary)] px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}