import { Task, TaskMode } from '@src';

export type WrappedBPTDeployment = {
  Vault: string;
  MockStablePool: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const MockStablePool = new Task('20250324-v3-stable-pool-v2', TaskMode.READ_ONLY);

export default {
  Vault,
  MockStablePool,
};
