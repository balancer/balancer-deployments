import { Task, TaskMode } from '@src';
import { MONTH } from '@helpers/time';

export type LBPoolFactoryDeployment = {
  Vault: string;
  Router: string;
  PauseWindowDuration: number;
  FactoryVersion: string;
  PoolVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
// Router used to add/remove liquidity.
const TrustedRouter = new Task('20241205-v3-router', TaskMode.READ_ONLY);

const BaseVersion = { version: 1, deployment: '20250307-v3-liquidity-bootstrapping-pool' };

export default {
  Vault,
  Router: TrustedRouter,
  PauseWindowDuration: 3 * MONTH,
  FactoryVersion: JSON.stringify({ name: 'LBPoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'LBPool', ...BaseVersion }),
};
