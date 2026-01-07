import { Task, TaskMode } from '@src';
import { YEAR } from '@helpers/time';

export type FixedPriceLBPoolFactoryDeployment = {
  Vault: string;
  WETH: string;
  TestBalancerToken: string;
  Router: string;
  PauseWindowDuration: number;
  FactoryVersion: string;
  PoolVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);
const TestBalancerToken = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY);

// Router used to add/remove liquidity.
const TrustedRouter = new Task('20250307-v3-router-v2', TaskMode.READ_ONLY);

const BaseVersion = { version: 1, deployment: '20251205-v3-fixed-price-lbp' };

export default {
  Vault,
  WETH,
  TestBalancerToken,
  Router: TrustedRouter,
  PauseWindowDuration: 4 * YEAR,
  FactoryVersion: JSON.stringify({ name: 'FixedPriceLBPoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'FixedPriceLBPool', ...BaseVersion }),
};
