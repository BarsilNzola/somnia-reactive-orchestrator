export const SOMNIA_TESTNET_CONFIG = {
  chainId: 50312,
  name: "Somnia Testnet",
  rpcUrl: "https://testnet.rpc.somnia.network",
  explorerUrl: "https://testnet.explorer.somnia.network"
} as const;

// Event signatures (keccak256 first 4 bytes)
export const EVENT_SIGNATURES: Record<string, string> = {
  '0x1a89285a': 'LiquidityUpdated',
  '0x895c0188': 'APYUpdated',
  '0x37542106': 'OraclePriceUpdated',
  '0xd187fca4': 'StakingPaused',
  '0xdcc519d6': 'StakingResumed',
  '0x9b99be9d': 'RewardRateUpdated',
  '0x8f0023b1': 'StrategyRebalanced',
  '0x018a853a': 'RuleRegistered',
  '0xb4fe175c': 'RuleDeactivated',
  '0x8491a7b2': 'RuleExecuted',
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
  { sig: '0x1a89285a', name: 'LiquidityUpdated', description: 'Fires when pool liquidity changes' },
  { sig: '0x895c0188', name: 'APYUpdated', description: 'Fires when APY is updated' },
  { sig: '0x37542106', name: 'OraclePriceUpdated', description: 'Fires when oracle price changes' },
];

export const AVAILABLE_ACTIONS = [
  {
    name: 'Pause Staking',
    callData: '0x6eedf33f', // pauseStaking()
    description: 'Pauses all staking operations',
  },
  {
    name: 'Resume Staking',
    callData: '0x3cd86b3a', // resumeStaking()
    description: 'Resumes staking operations',
  },
  {
    name: 'Rebalance Strategy',
    callData: '0x2aba0f48', // rebalanceStrategy()
    description: 'Triggers a strategy rebalance',
  },
];