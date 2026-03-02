import LiquidityPoolABI from '../abis/LiquidityPool.json';
import StakingManagerABI from '../abis/StakingManager.json';
import ReactiveOrchestratorABI from '../abis/ReactiveOrchestrator.json';

export const abis = {
  liquidityPool: LiquidityPoolABI.abi,
  stakingManager: StakingManagerABI.abi,
  orchestrator: ReactiveOrchestratorABI.abi
} as const;

// For type safety, you can also export the raw ABIs
export const rawAbis = {
  liquidityPool: LiquidityPoolABI,
  stakingManager: StakingManagerABI,
  orchestrator: ReactiveOrchestratorABI
} as const;