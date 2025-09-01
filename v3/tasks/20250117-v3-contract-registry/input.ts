import { Task, TaskMode } from '@src';

export type BalancerContractRegistryDeployment = {
  Vault: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);

export default {
  Vault,
};
