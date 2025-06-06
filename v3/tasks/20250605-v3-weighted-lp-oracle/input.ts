import { Task, TaskMode } from '@src';

export type WeightedLPOracleDeployment = {
  Vault: string;
  Version: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const Version = 1;

export default {
  Vault,
  Version,
};
