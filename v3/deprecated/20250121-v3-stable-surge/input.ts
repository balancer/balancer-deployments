import { fp } from '@helpers/numbers';
import { MONTH } from '@helpers/time';
import { Task, TaskMode } from '@src';

export type StableSurgePoolDeployment = {
  Vault: string;
  PauseWindowDuration: number;
  WETH: string;
  BAL: string;
  DefaultMaxSurgeFeePercentage: bigint;
  DefaultSurgeThresholdPercentage: bigint;
  FactoryVersion: string;
  PoolVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);
const BAL = new Task('00000000-tokens', TaskMode.READ_ONLY);

const DefaultMaxSurgeFeePercentage = fp(0.95);
const DefaultSurgeThresholdPercentage = fp(0.3);

const BaseVersion = { version: 1, deployment: '20250121-v3-stable-surge' };

export default {
  Vault,
  PauseWindowDuration: 4 * 12 * MONTH,
  WETH,
  BAL,
  DefaultMaxSurgeFeePercentage,
  DefaultSurgeThresholdPercentage,
  FactoryVersion: JSON.stringify({ name: 'StableSurgePoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'StableSurgePool', ...BaseVersion }),
};
