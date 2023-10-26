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
const Version = JSON.stringify({
  name: 'ChildChainGauge checkpointer (BalancerRelayer)',
  version: 5.1,
  deployment: '20230712-child-chain-gauge-checkpointer',
});

// We will not use the minter nor wstETH for this deployment.
// In any case they are not deployed in L2s.
export default {
  Vault,
  wstETH: ZERO_ADDRESS,
  BalancerMinter: ZERO_ADDRESS,
  CanCallUserCheckpoint: true,
  Version,
};
