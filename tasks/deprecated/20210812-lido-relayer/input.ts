import { Task, TaskMode } from '@src';

export type LidoRelayerDeployment = {
  Vault: string;
  wstETH: string;
};

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);

export default {
  mainnet: {
    Vault,
    wstETH: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  },
};
