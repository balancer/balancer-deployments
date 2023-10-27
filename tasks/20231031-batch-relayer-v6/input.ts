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

const version = {
  name: 'BatchRelayer',
  version: '6',
  deployment: '20231031-batch-relayer-v6',
};

export default {
  Vault,
  Version: JSON.stringify(version),
  // wstETH and BalancerMinter are only deployed on mainnet, and goerli.
  mainnet: {
    wstETH: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
    BalancerMinter,
    CanCallUserCheckpoint: true,
  },
  goerli: {
    wstETH: '0x6320cD32aA674d2898A68ec82e869385Fc5f7E2f',
    BalancerMinter,
    CanCallUserCheckpoint: true,
  },
  sepolia: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter,
    CanCallUserCheckpoint: true,
  },
  polygon: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: ZERO_ADDRESS,
    CanCallUserCheckpoint: false,
  },
  arbitrum: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: ZERO_ADDRESS,
    CanCallUserCheckpoint: false,
  },
  optimism: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: ZERO_ADDRESS,
    CanCallUserCheckpoint: false,
  },
  gnosis: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: ZERO_ADDRESS,
    CanCallUserCheckpoint: false,
  },
  bsc: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: ZERO_ADDRESS,
    CanCallUserCheckpoint: false,
  },
  avalanche: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: ZERO_ADDRESS,
    CanCallUserCheckpoint: false,
  },
  zkevm: {
    wstETH: ZERO_ADDRESS,
    BalancerMinter: ZERO_ADDRESS,
    CanCallUserCheckpoint: false,
  },
};
