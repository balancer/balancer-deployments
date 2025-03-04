import { Task, TaskMode } from '@src';
import { YEAR } from '@helpers/time';

export type LBPoolFactoryDeployment = {
  Vault: string;
  Router: string;
  PauseWindowDuration: number;
  FactoryVersion: string;
  PoolVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
// Router used to add/remove liquidity.
const TrustedRouter = new Task('20250307-v3-router-v2', TaskMode.READ_ONLY);

const BaseVersion = { version: 1, deployment: '20250307-v3-liquidity-bootstrapping-pool' };

export default {
  Vault,
  Router: TrustedRouter,
  PauseWindowDuration: 4 * YEAR,
  FactoryVersion: JSON.stringify({ name: 'LBPoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'LBPool', ...BaseVersion }),
};
