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
  SequencerUptimeFeed: ZERO_ADDRESS,
};
