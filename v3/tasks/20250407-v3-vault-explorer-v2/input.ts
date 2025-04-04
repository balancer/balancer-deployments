import { Task, TaskMode } from '@src';

export type VaultExplorerV2Deployment = {
  Vault: string;
  Permit2: string;
  WETH: string;
  BAL: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const Permit2 = new Task('00000000-permit2', TaskMode.READ_ONLY);

// Tokens are needed for the fork test.
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);
const BAL = new Task('00000000-tokens', TaskMode.READ_ONLY);

export default {
  Vault,
  Permit2,
  WETH,
  BAL,
};
