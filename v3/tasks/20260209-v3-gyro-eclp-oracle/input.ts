import { ZERO_ADDRESS } from '@helpers/constants';
import { HOUR } from '@helpers/time';
import { Task, TaskMode } from '@src';

export type EclpLPOracleDeployment = {
  Vault: string;
  ConstantPriceFeed: string;
  FactoryVersion: string;
  OracleVersion: string;
  MockGyroECLPPool: string;
  ShouldUseBlockTimeForOldestFeedUpdate: boolean;
  ShouldRevertIfVaultUnlocked: boolean;
  UptimeResyncWindow: number;
  SequencerUptimeFeed: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const ConstantPriceFeed = new Task('20250813-v3-constant-price-feed', TaskMode.READ_ONLY);
const MockGyroECLPPool = new Task('20260126-v3-gyro-eclp-v2', TaskMode.READ_ONLY);
const OracleVersion = 1;
const UptimeResyncWindow = HOUR;
const BaseVersion = { version: OracleVersion, deployment: '20260209-v3-gyro-eclp-oracle' };

export default {
  Vault,
  ConstantPriceFeed,
  FactoryVersion: JSON.stringify({ name: 'EclpLPOracleFactory', ...BaseVersion }),
  OracleVersion,
  MockGyroECLPPool,
  ShouldUseBlockTimeForOldestFeedUpdate: false,
  ShouldRevertIfVaultUnlocked: true,
  UptimeResyncWindow,
  SequencerUptimeFeed: ZERO_ADDRESS,
};
