import { ZERO_ADDRESS } from '@helpers/constants';
import { Task, TaskMode } from '@src';

export type WeightedLPOracleDeployment = {
  Vault: string;
  ConstantPriceFeed: string;
  FactoryVersion: string;
  OracleVersion: string;
  MockWeightedPool: string;
  ShouldUseBlockTimeForOldestFeedUpdate: boolean;
  ShouldRevertIfVaultUnlocked: boolean;
  UptimeResyncWindow: number;
  SequencerUptimeFeed: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const ConstantPriceFeed = new Task('20250813-v3-constant-price-feed', TaskMode.READ_ONLY);
const MockWeightedPool = new Task('20260115-v3-weighted-pool-v2', TaskMode.READ_ONLY);
const OracleVersion = 2;
const UptimeResyncWindow = 3600; // 1 hour in seconds
const BaseVersion = { version: OracleVersion, deployment: '20260202-v3-weighted-pool-oracle-v2' };

export default {
  Vault,
  ConstantPriceFeed,
  FactoryVersion: JSON.stringify({ name: 'WeightedLPOracleFactory', ...BaseVersion }),
  OracleVersion,
  MockWeightedPool,
  ShouldUseBlockTimeForOldestFeedUpdate: false,
  ShouldRevertIfVaultUnlocked: true,
  UptimeResyncWindow,

  // https://docs.chain.link/data-feeds/l2-sequencer-feeds
  arbitrum: {
    SequencerUptimeFeed: '0xFdB631F5EE196F0ed6FAa767959853A9F217697D',
  },
  avalanche: {
    SequencerUptimeFeed: ZERO_ADDRESS,
  },
  base: {
    SequencerUptimeFeed: '0xBCF85224fc0756B9Fa45aA7892530B47e10b6433',
  },
  gnosis: {
    SequencerUptimeFeed: ZERO_ADDRESS,
  },
  hyperevm: {
    SequencerUptimeFeed: ZERO_ADDRESS,
  },
  mainnet: {
    SequencerUptimeFeed: ZERO_ADDRESS,
  },
  optimism: {
    SequencerUptimeFeed: '0x371EAD81c9102C9BF4874A9075FFFf170F2Ee389',
  },
  plasma: {
    SequencerUptimeFeed: ZERO_ADDRESS,
  },
  xlayer: {
    SequencerUptimeFeed: '0x45c2b8C204568A03Dc7A2E32B71D67Fe97F908A9',
  },
  monad: {
    SequencerUptimeFeed: ZERO_ADDRESS,
  },
  sepolia: {
    SequencerUptimeFeed: ZERO_ADDRESS,
  },
};
