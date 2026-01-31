import { ZERO_ADDRESS } from '@helpers/constants';
import { Task, TaskMode } from '@src';

export type StableLPOracleDeployment = {
  Vault: string;
  ConstantPriceFeed: string;
  FactoryVersion: string;
  OracleVersion: string;
  MockStablePool: string;
  ShouldUseBlockTimeForOldestFeedUpdate: boolean;
  ShouldRevertIfVaultUnlocked: boolean;
  UptimeResyncWindow: number;
  SequencerUptimeFeed: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const ConstantPriceFeed = new Task('20250813-v3-constant-price-feed', TaskMode.READ_ONLY);
const MockStablePool = new Task('20260116-v3-stable-pool-v3', TaskMode.READ_ONLY);
const OracleVersion = 1;
const UptimeResyncWindow = 3600; // 1 hour in seconds
const BaseVersion = { version: 1, deployment: '20260203-v3-stable-pool-oracle-v2' };

export default {
  Vault,
  ConstantPriceFeed,
  FactoryVersion: JSON.stringify({ name: 'StableLPOracleFactory', ...BaseVersion }),
  OracleVersion,
  MockStablePool,
  ShouldUseBlockTimeForOldestFeedUpdate: false,
  ShouldRevertIfVaultUnlocked: true,
  UptimeResyncWindow,
  SequencerUptimeFeed: ZERO_ADDRESS,
};
