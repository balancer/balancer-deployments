import { MONTH } from '@helpers/time';
import { Task, TaskMode } from '@src';

export type ReClammPoolDeployment = {
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

const BaseVersion = { version: 1, deployment: '20250409-v3-reclamm-pool' };

export default {
  Vault,
  PauseWindowDuration: 4 * 12 * MONTH,
  TestBalancerToken,
  WETH,
  FactoryVersion: JSON.stringify({ name: 'ReClammPoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'ReClammPool', ...BaseVersion }),
};
