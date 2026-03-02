import React from 'react';
import { formatEther } from 'ethers';

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
}

export default function RuleCard({ rule, onDeactivate }: RuleCardProps) {
  const getEventName = (sig: string) => {
    const eventMap: Record<string, string> = {
      '0xf1f86f8f': 'LiquidityUpdated',
      '0x7bb53a16': 'OraclePriceUpdated',
      '0x787a1fca': 'APYUpdated'
    };
    return eventMap[sig] || sig;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatThreshold = (threshold: bigint, eventSig: string) => {
    if (eventSig === '0x787a1fca') { // APYUpdated
      return threshold.toString();
    }
    return `${formatEther(threshold)} SOM`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${
      rule.active ? 'border-gray-200' : 'border-red-200 bg-red-50'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Rule #{rule.id}
          </h3>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-2 ${
            rule.active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {rule.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        {rule.active && (
          <button
            onClick={() => onDeactivate(rule.id)}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Deactivate
          </button>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Event:</span>
          <span className="font-medium text-gray-900">{getEventName(rule.eventSig)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Threshold:</span>
          <span className="font-medium text-gray-900">{formatThreshold(rule.threshold, rule.eventSig)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Source:</span>
          <span className="font-mono text-gray-900">{formatAddress(rule.source)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Target:</span>
          <span className="font-mono text-gray-900">{formatAddress(rule.target)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Created:</span>
          <span className="text-gray-900">{new Date(rule.createdAt * 1000).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}