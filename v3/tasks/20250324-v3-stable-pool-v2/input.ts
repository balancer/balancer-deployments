import { MONTH } from '@helpers/time';
import { Task, TaskMode } from '@src';

export type StablePoolDeployment = {
  Vault: string;
  PauseWindowDuration: number;
  BAL: string;
  WETH: string;
  FactoryVersion: string;
  PoolVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const BAL = new Task('00000000-tokens', TaskMode.READ_ONLY);
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);

const BaseVersion = { version: 2, deployment: '20250324-v3-stable-pool-v2' };

export default {
  Vault,
  PauseWindowDuration: 4 * 12 * MONTH,
  BAL,
  WETH,
  FactoryVersion: JSON.stringify({ name: 'StablePoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'StablePool', ...BaseVersion }),
};
