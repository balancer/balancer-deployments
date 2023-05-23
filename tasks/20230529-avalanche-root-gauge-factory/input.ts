import { BigNumber } from 'ethers';
import { Task, TaskMode } from '@src';
import { fp } from '@helpers/numbers';

export type AvalancheRootGaugeFactoryDeployment = {
  Vault: string;
  BalancerMinter: string;
  MultichainRouter: string;
  MinBridgeLimit: BigNumber;
  MaxBridgeLimit: BigNumber;
};

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);
const BalancerMinter = new Task('20220325-gauge-controller', TaskMode.READ_ONLY);

export default {
  mainnet: {
    Vault,
    BalancerMinter,
    // From https://docs.multichain.org/developer-guide/bridge-api-token-list-tx-status
    MultichainRouter: '0x765277eebeca2e31912c9946eae1021199b39c61',
    // The following values were taken from the router UI: https://app.multichain.org/#/router
    MinBridgeLimit: fp(1.459854),
    MaxBridgeLimit: fp(729927.007299),
  },
};
