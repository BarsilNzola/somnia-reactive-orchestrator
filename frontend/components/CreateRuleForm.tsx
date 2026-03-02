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

    const params = action.params.map(p => {
      const value = actionParams[p];
      return value ? BigInt(value) : 0n;
    });
    
    return stakingManagerInterface.encodeFunctionData(selectedAction, params);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEvent || !selectedAction || !threshold) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Convert threshold to the appropriate format
      let thresholdValue: bigint;
      if (selectedEvent === 'APYUpdated') {
        thresholdValue = BigInt(threshold);
      } else {
        thresholdValue = ethers.parseEther(threshold);
      }

      await onSubmit({
        source: contractAddresses.liquidityPool,
        eventSig: getEventSig(selectedEvent),
        threshold: thresholdValue,
        target: contractAddresses.stakingManager,
        callData: getActionData()
      });

      // Reset form
      setSelectedEvent('');
      setSelectedAction('');
      setThreshold('');
      setActionParams({});
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error creating rule. Check console for details.');
    }
  };

  const isFormValid = selectedEvent && selectedAction && threshold;

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
            onChange={(e) => {
              setSelectedEvent(e.target.value);
              setThreshold(''); // Reset threshold when event changes
            }}
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
              placeholder={selectedEvent === 'APYUpdated' ? 'Enter APY value (e.g., 300)' : 'Enter SOM amount (e.g., 10000)'}
              step={selectedEvent === 'APYUpdated' ? '1' : '0.000000000000000001'}
              min="0"
              required
            />
            <span className="absolute right-3 top-2 text-sm text-gray-500">
              {selectedEvent === 'APYUpdated' ? '' : 'SOM'}
            </span>
          </div>
          {selectedEvent !== 'APYUpdated' && (
            <p className="mt-1 text-xs text-gray-500">
              Enter amount in SOM (e.g., 10000 for 10,000 SOM)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Action
          </label>
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setActionParams({});
            }}
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
              placeholder={`Enter ${param} value`}
              step="1"
              min="0"
              required
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading || !isFormValid}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors ${
            loading || !isFormValid ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Creating...' : 'Create Rule'}
        </button>

        {!isFormValid && (
          <p className="text-sm text-red-600 text-center">
            Please fill in all required fields
          </p>
        )}
      </div>
    </form>
  );
}