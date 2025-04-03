import { fp } from '@helpers/numbers';
import { MONTH } from '@helpers/time';
import { Task, TaskMode } from '@src';

export type StableSurgePoolDeployment = {
  Vault: string;
  StableSurgeHook: string;
  PauseWindowDuration: number;
  WETH: string;
  BAL: string;
  FactoryVersion: string;
  PoolVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const StableSurgeHook = new Task('20250403-v3-stable-surge-hook-v2', TaskMode.READ_ONLY);
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);
const BAL = new Task('00000000-tokens', TaskMode.READ_ONLY);

const BaseVersion = { version: 2, deployment: '20250404-v3-stable-surge-factory-v2' };

export default {
  Vault,
  StableSurgeHook,
  PauseWindowDuration: 4 * 12 * MONTH,
  WETH,
  BAL,
  FactoryVersion: JSON.stringify({ name: 'StableSurgePoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'StableSurgePool', ...BaseVersion }),
};
