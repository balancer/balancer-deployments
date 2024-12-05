import { Task, TaskMode } from '@src';

export type RouterDeployment = {
  Vault: string;
  WETH: string;
  BAL: string;
  Permit2: string;
  RouterVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);
const BAL = new Task('00000000-tokens', TaskMode.READ_ONLY);
const Permit2 = new Task('00000000-permit2', TaskMode.READ_ONLY);
const BaseVersion = { version: 1, deployment: '20241205-v3-router' };

export default {
  Vault,
  WETH,
  BAL,
  Permit2,
  RouterVersion: JSON.stringify({ name: 'Router', ...BaseVersion }),
};
