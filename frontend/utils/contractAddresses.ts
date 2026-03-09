// Load contract addresses from environment variables
const getAddresses = () => {
  const addresses = {
    liquidityPool: process.env.NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS,
    stakingManager: process.env.NEXT_PUBLIC_STAKING_MANAGER_ADDRESS,
    orchestrator: process.env.NEXT_PUBLIC_ORCHESTRATOR_ADDRESS,
  };

  const missingAddresses = Object.entries(addresses)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingAddresses.length > 0) {
    console.warn(
      `Missing contract addresses: ${missingAddresses.join(', ')}. ` +
        'Set them in .env.local after deploying contracts.'
    );
  }

  return addresses as {
    liquidityPool: string;
    stakingManager: string;
    orchestrator: string;
  };
};

export const contractAddresses = getAddresses();

// Helper: check if all addresses are set (non-zero)
export const isDeployed = () => {
  const { liquidityPool, stakingManager, orchestrator } = contractAddresses;
  const zero = '0x0000000000000000000000000000000000000000';
  return (
    !!liquidityPool && liquidityPool !== zero &&
    !!stakingManager && stakingManager !== zero &&
    !!orchestrator && orchestrator !== zero
  );
};