import LiquidityPoolABI from '../abis/LiquidityPool.json';
import StakingManagerABI from '../abis/StakingManager.json';
import ReactiveOrchestratorABI from '../abis/ReactiveOrchestrator.json';

// Load contract addresses from environment variables
const getAddresses = () => {
  const addresses = {
    liquidityPool: process.env.NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS,
    stakingManager: process.env.NEXT_PUBLIC_STAKING_MANAGER_ADDRESS,
    orchestrator: process.env.NEXT_PUBLIC_ORCHESTRATOR_ADDRESS
  };

  // Validate that all addresses are present
  const missingAddresses = Object.entries(addresses)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingAddresses.length > 0) {
    console.warn(
      `Missing contract addresses in environment: ${missingAddresses.join(', ')}. ` +
      'Please set them in your .env.local file.'
    );
  }

  return addresses as {
    liquidityPool: string;
    stakingManager: string;
    orchestrator: string;
  };
};

export const contractAddresses = getAddresses();

// Export ABIs from JSON files
export const abis = {
  liquidityPool: LiquidityPoolABI.abi,
  stakingManager: StakingManagerABI.abi,
  orchestrator: ReactiveOrchestratorABI.abi
} as const;

// Export full artifacts if needed (for bytecode, etc.)
export const artifacts = {
  liquidityPool: LiquidityPoolABI,
  stakingManager: StakingManagerABI,
  orchestrator: ReactiveOrchestratorABI
} as const;