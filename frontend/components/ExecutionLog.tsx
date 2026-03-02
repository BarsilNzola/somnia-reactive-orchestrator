import React from 'react';

interface ExecutionLogProps {
  execution: {
    ruleId: number;
    timestamp: number;
    success: boolean;
    returnData: string;
    gasUsed: bigint;
  };
}

export default function ExecutionLog({ execution }: ExecutionLogProps) {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className={`border-l-4 ${
      execution.success ? 'border-green-500' : 'border-red-500'
    } bg-white shadow-sm rounded-r-lg p-4 mb-2`}>
      <div className="flex justify-between items-start">
        <div>
          <span className="text-sm font-medium text-gray-900">
            Rule #{execution.ruleId}
          </span>
          <span className={`ml-2 inline-block px-2 py-1 text-xs font-medium rounded-full ${
            execution.success 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {execution.success ? 'Success' : 'Failed'}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {formatTimestamp(execution.timestamp)}
        </span>
      </div>
      <div className="mt-2 text-xs text-gray-600">
        <div>Gas Used: {execution.gasUsed.toString()}</div>
        {!execution.success && execution.returnData !== '0x' && (
          <div className="mt-1 text-red-600 truncate">
            Error: {execution.returnData}
          </div>
        )}
      </div>
    </div>
  );
}