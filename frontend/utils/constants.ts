export const SOMNIA_TESTNET_CONFIG = {
  chainId: 50312,
  name: 'Somnia Testnet',
  rpcUrl: 'https://dream-rpc.somnia.network',
  blockExplorer: 'https://testnet.explorer.somnia.network',
  wsUrl: 'wss://testnet.rpc.somnia.network/ws',
};

// Event signatures — verified from deployment output
export const EVENT_SIGNATURES: Record<string, string> = {
  '0xf1f86f8f': 'LiquidityUpdated',   // Rule 0
  '0x7bb53a16': 'OraclePriceUpdated', // Rule 1
  '0x787a1fca': 'APYUpdated',         // Rule 2
};

// Rule type options for the Create Rule form
export const RULE_TYPES = [
  { value: 'threshold', label: 'Threshold Rule' },
  { value: 'percentage', label: 'Percentage Change Rule' },
  { value: 'time', label: 'Time-based Rule' },
] as const;

// Events emitted by LiquidityPool (source contract)
export const EVENTS = [
  { value: 'LiquidityUpdated', label: 'Liquidity Updated', params: ['newLiquidity', 'timestamp'] },
  { value: 'APYUpdated', label: 'APY Updated', params: ['newAPY', 'timestamp'] },
  { value: 'OraclePriceUpdated', label: 'Oracle Price Updated', params: ['newPrice', 'timestamp'] },
] as const;

// Actions callable on StakingManager (target contract)
export const ACTIONS = [
  { value: 'pauseStaking', label: 'Pause Staking', params: [] },
  { value: 'resumeStaking', label: 'Resume Staking', params: [] },
  { value: 'rebalanceStrategy', label: 'Rebalance Strategy', params: [] },
  { value: 'updateRewardRate', label: 'Update Reward Rate', params: ['newRate'] },
] as const;

export const AVAILABLE_EVENTS = [
  { sig: '0xf1f86f8f', name: 'LiquidityUpdated',   description: 'Fires when pool liquidity changes — Rule 0: threshold 10,000 SOM' },
  { sig: '0x7bb53a16', name: 'OraclePriceUpdated',  description: 'Fires when oracle price changes — Rule 1: threshold 80 SOM' },
  { sig: '0x787a1fca', name: 'APYUpdated',          description: 'Fires when APY is updated — Rule 2: threshold 300 bps' },
];

export const AVAILABLE_ACTIONS = [
  { name: 'Pause Staking',      callData: '0xf999c506', description: 'Pauses all staking operations' },
  { name: 'Resume Staking',     callData: '0x7475f913', description: 'Resumes staking operations' },
  { name: 'Rebalance Strategy', callData: '0xdb7a3ea3', description: 'Triggers a strategy rebalance' },
];