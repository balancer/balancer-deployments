import { ZERO_ADDRESS } from '@helpers/constants';
import { Task, TaskMode } from '@src';

export type BatchRelayerDeployment = {
  Vault: string;
  wstETH: string;
  BalancerMinter: string;
  CanCallUserCheckpoint: boolean;
  Version: string;
};

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);
const BalancerMinter = new Task('20220325-gauge-controller', TaskMode.READ_ONLY);
const L2BalancerPseudoMinter = new Task('20230316-l2-balancer-pseudo-minter', TaskMode.READ_ONLY);

const version = {
  name: 'BatchRelayer',
  version: '6',
  deployment: '20231031-batch-relayer-v6',
};

export default {
  Vault,
  Version: JSON.stringify(version),
  // wstETH and BalancerMinter are only deployed on mainnet and testnets.
  // On L2s, we can use the L2BalancerPseudoMinter, which has the same interface as BalancerMinter.
  mainnet: {
    wstETH: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
    BalancerMinter,
    CanCallUserCheckpoint: false,
  },
  sepolia: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter,
    CanCallUserCheckpoint: false,
  },
  polygon: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: L2BalancerPseudoMinter.output({ network: 'polygon' }).L2BalancerPseudoMinter,
    CanCallUserCheckpoint: true,
  },
  arbitrum: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: L2BalancerPseudoMinter.output({ network: 'arbitrum' }).L2BalancerPseudoMinter,
    CanCallUserCheckpoint: true,
  },
  optimism: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: L2BalancerPseudoMinter.output({ network: 'optimism' }).L2BalancerPseudoMinter,
    CanCallUserCheckpoint: true,
  },
  gnosis: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: L2BalancerPseudoMinter.output({ network: 'gnosis' }).L2BalancerPseudoMinter,
    CanCallUserCheckpoint: true,
  },
  bsc: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: ZERO_ADDRESS,
    CanCallUserCheckpoint: true,
  },
  avalanche: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: L2BalancerPseudoMinter.output({ network: 'avalanche' }).L2BalancerPseudoMinter,
    CanCallUserCheckpoint: true,
  },
  zkevm: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: L2BalancerPseudoMinter.output({ network: 'zkevm' }).L2BalancerPseudoMinter,
    CanCallUserCheckpoint: true,
  },
  base: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: L2BalancerPseudoMinter.output({ network: 'base' }).L2BalancerPseudoMinter,
    CanCallUserCheckpoint: true,
  },
  fraxtal: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: L2BalancerPseudoMinter.output({ network: 'fraxtal' }).L2BalancerPseudoMinter,
    CanCallUserCheckpoint: true,
  },
  mode: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: L2BalancerPseudoMinter.output({ network: 'mode' }).L2BalancerPseudoMinter,
    CanCallUserCheckpoint: true,
  },
  sonic: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: ZERO_ADDRESS,
    CanCallUserCheckpoint: true,
  },
};
