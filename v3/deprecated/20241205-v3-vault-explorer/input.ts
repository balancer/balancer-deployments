import { Task, TaskMode } from '@src';

export type VaultExplorerDeployment = {
  Vault: string;
  WETH: string;
  BAL: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);

// Tokens are needed for the fork test.
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);
const BAL = new Task('00000000-tokens', TaskMode.READ_ONLY);

export default {
  Vault,
  WETH,
  BAL,
};
