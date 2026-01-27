import { MONTH } from '@helpers/time';
import { Task, TaskMode } from '@src';

export type WeightedPoolDeployment = {
  Vault: string;
  PauseWindowDuration: number;
  WETH: string;
  TestBalancerToken: string;
  FactoryVersion: string;
  PoolVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);
const TestBalancerToken = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY);

const BaseVersion = { version: 2, deployment: '20260115-v3-weighted-pool-v2' };

export default {
  Vault,
  PauseWindowDuration: 75 * 12 * MONTH, // 75 years
  WETH,
  TestBalancerToken,
  FactoryVersion: JSON.stringify({ name: 'WeightedPoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'WeightedPool', ...BaseVersion }),
};
