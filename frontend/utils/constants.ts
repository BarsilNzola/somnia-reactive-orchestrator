export const SOMNIA_TESTNET_CONFIG = {
  chainId: 50342,
  name: "Somnia Testnet",
  rpcUrl: "https://testnet.rpc.somnia.network",
  explorerUrl: "https://testnet.explorer.somnia.network"
} as const;

export const RULE_TYPES = [
  { value: "threshold", label: "Threshold Rule" },
  { value: "percentage", label: "Percentage Change Rule" },
  { value: "time", label: "Time-based Rule" }
] as const;

export const EVENTS = [
  { value: "LiquidityUpdated", label: "Liquidity Updated", params: ["newLiquidity", "timestamp"] },
  { value: "APYUpdated", label: "APY Updated", params: ["newAPY", "timestamp"] },
  { value: "OraclePriceUpdated", label: "Oracle Price Updated", params: ["newPrice", "timestamp"] }
] as const;

export const ACTIONS = [
  { value: "pauseStaking", label: "Pause Staking", params: [] },
  { value: "resumeStaking", label: "Resume Staking", params: [] },
  { value: "rebalanceStrategy", label: "Rebalance Strategy", params: [] },
  { value: "updateRewardRate", label: "Update Reward Rate", params: ["newRate"] }
] as const;