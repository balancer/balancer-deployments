import { Task, TaskMode } from '@src';

export type RouterDeployment = {
  Vault: string;
  Permit2: string;
  WETH: string;
  RouterVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const Permit2 = new Task('00000000-permit2', TaskMode.READ_ONLY);
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);
const BaseVersion = { version: 2, deployment: '20250307-v3-router-v2' };

export default {
  Vault,
  Permit2,
  WETH,
  RouterVersion: JSON.stringify({ name: 'Router', ...BaseVersion }),
};
