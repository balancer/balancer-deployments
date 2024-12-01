import { Task, TaskMode } from '@src';

export type BatchRelayerDeployment = {
  Vault: string;
  wstETH: string;
};

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);

export default {
  // wstETH is only deployed on mainnet
  mainnet: {
    Vault,
    wstETH: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
  },
  polygon: {
    Vault,
    wstETH: '0x0000000000000000000000000000000000000000',
  },
  arbitrum: {
    Vault,
    wstETH: '0x0000000000000000000000000000000000000000',
  },
};
