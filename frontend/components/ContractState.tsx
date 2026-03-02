import React from 'react';
import { formatEther } from 'ethers';

interface ContractStateProps {
  title: string;
  metrics: {
    label: string;
    value: string | number | boolean;
    format?: 'ether' | 'number' | 'boolean';
  }[];
}

export default function ContractState({ title, metrics }: ContractStateProps) {
  const formatValue = (value: string | number | boolean, format?: 'ether' | 'number' | 'boolean') => {
    if (format === 'ether' && typeof value === 'string') {
      return `${formatEther(value)} SOM`;
    }
    if (format === 'boolean' && typeof value === 'boolean') {
      return value ? 'Active' : 'Inactive';
    }
    return value.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {metrics.map((metric, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{metric.label}:</span>
            <span className="text-sm font-medium text-gray-900">
              {formatValue(metric.value, metric.format)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}