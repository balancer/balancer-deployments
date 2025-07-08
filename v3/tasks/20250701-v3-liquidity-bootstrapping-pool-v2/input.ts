import { Task, TaskMode } from '@src';
import { YEAR } from '@helpers/time';

export type LBPoolFactoryDeployment = {
  Vault: string;
  BalancerContractRegistry: string;
  WETH: string;
  TestBalancerToken: string;
  Router: string;
  PauseWindowDuration: number;
  LBPMigrationRouterVersion: string;
  FactoryVersion: string;
  PoolVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const BalancerContractRegistry = new Task('20250117-v3-contract-registry', TaskMode.READ_ONLY);
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);
const TestBalancerToken = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY);

// Router used to add/remove liquidity.
const TrustedRouter = new Task('20250307-v3-router-v2', TaskMode.READ_ONLY);

const BaseVersion = { version: 2, deployment: '20250701-v3-liquidity-bootstrapping-pool-v2' };

export default {
  Vault,
  BalancerContractRegistry,
  WETH,
  TestBalancerToken,
  Router: TrustedRouter,
  PauseWindowDuration: 4 * YEAR,
  LBPMigrationRouterVersion: JSON.stringify({ name: 'LBPMigrationRouter', ...BaseVersion }),
  FactoryVersion: JSON.stringify({ name: 'LBPoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'LBPool', ...BaseVersion }),
};
