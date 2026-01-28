import { MONTH } from '@helpers/time';
import { Task, TaskMode } from '@src';

export type Gyro2CLPPoolDeployment = {
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

const BaseVersion = { version: 1, deployment: '20250120-v3-gyro-2clp' };

export default {
  Vault,
  PauseWindowDuration: 4 * 12 * MONTH,
  WETH,
  TestBalancerToken,
  FactoryVersion: JSON.stringify({ name: 'Gyro2CLPPoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'Gyro2CLPPool', ...BaseVersion }),
};
