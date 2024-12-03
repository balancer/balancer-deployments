import { Task, TaskMode } from '@src';

export type InvestmentPoolDeployment = {
  Vault: string;
};

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);

export default {
  Vault,
};
