import React, { useState } from 'react';
import { ethers } from 'ethers';
import { EVENTS, ACTIONS } from '../utils/constants';
import { contractAddresses } from '../utils/contractAddresses';

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

export default function CreateRuleForm({ onSubmit, loading }: CreateRuleFormProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [threshold, setThreshold] = useState<string>('');
  const [actionParams, setActionParams] = useState<Record<string, string>>({});

  const getEventSig = (eventName: string) => {
    const sig = ethers.id(`${eventName}(uint256,uint256)`).substring(0, 10);
    return sig;
  };

  const getActionData = () => {
    const action = ACTIONS.find(a => a.value === selectedAction);
    if (!action) return '0x';

    const stakingManagerInterface = new ethers.Interface([
      `function ${selectedAction}(${action.params.map(p => 'uint256').join(',')}) external`
    ]);

    const params = action.params.map(p => actionParams[p] || '0');
    return stakingManagerInterface.encodeFunctionData(selectedAction, params.map(p => BigInt(p)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await onSubmit({
      source: contractAddresses.liquidityPool,
      eventSig: getEventSig(selectedEvent),
      threshold: ethers.parseEther(threshold),
      target: contractAddresses.stakingManager,
      callData: getActionData()
    });

    setSelectedEvent('');
    setSelectedAction('');
    setThreshold('');
    setActionParams({});
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Create New Rule</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Event
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select an event</option>
            {EVENTS.map((event) => (
              <option key={event.value} value={event.value}>
                {event.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Threshold Value
          </label>
          <div className="relative">
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={selectedEvent === 'APYUpdated' ? 'Enter APY value' : 'Enter SOM amount'}
              step="any"
              required
            />
            <span className="absolute right-3 top-2 text-sm text-gray-500">
              {selectedEvent === 'APYUpdated' ? '' : 'SOM'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Action
          </label>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select an action</option>
            {ACTIONS.map((action) => (
              <option key={action.value} value={action.value}>
                {action.label}
              </option>
            ))}
          </select>
        </div>

        {selectedAction && ACTIONS.find(a => a.value === selectedAction)?.params.map((param) => (
          <div key={param}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {param}
            </label>
            <input
              type="number"
              value={actionParams[param] || ''}
              onChange={(e) => setActionParams({ ...actionParams, [param]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Creating...' : 'Create Rule'}
        </button>
      </div>
    </form>
  );
}