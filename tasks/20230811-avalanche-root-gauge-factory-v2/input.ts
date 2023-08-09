import { Task, TaskMode } from '@src';

export type AvalancheRootGaugeFactoryDeployment = {
  Vault: string;
  BalancerMinter: string;
  BALProxy: string;
};

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);
const BalancerMinter = new Task('20220325-gauge-controller', TaskMode.READ_ONLY);
const BALProxy = '0xE15bCB9E0EA69e6aB9FA080c4c4A5632896298C3';

export default {
  mainnet: {
    Vault,
    BalancerMinter,
    BALProxy,
  },
};
