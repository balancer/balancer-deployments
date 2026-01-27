import { MONTH } from '@helpers/time';
import { Task, TaskMode } from '@src';

export type StablePoolDeployment = {
  Vault: string;
  PauseWindowDuration: number;
  TestBalancerToken: string;
  WETH: string;
  FactoryVersion: string;
  PoolVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const TestBalancerToken = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY);
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);

const BaseVersion = { version: 3, deployment: '20260116-v3-stable-pool-v3' };

export default {
  Vault,
  PauseWindowDuration: 75 * 12 * MONTH, // 75 years
  TestBalancerToken,
  WETH,
  FactoryVersion: JSON.stringify({ name: 'StablePoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'StablePool', ...BaseVersion }),
};
