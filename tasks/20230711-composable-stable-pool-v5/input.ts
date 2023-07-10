import { Task, TaskMode } from '@src';

export type ComposableStablePoolDeployment = {
  Vault: string;
  ProtocolFeePercentagesProvider: string;
  FactoryVersion: string;
  PoolVersion: string;
  WETH: string;
  BAL: string;
};

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);
const ProtocolFeePercentagesProvider = new Task('20220725-protocol-fee-percentages-provider', TaskMode.READ_ONLY);
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);
const BAL = new Task('00000000-tokens', TaskMode.READ_ONLY);

const BaseVersion = { version: 5, deployment: '20230711-composable-stable-pool-v5' };

export default {
  Vault,
  ProtocolFeePercentagesProvider,
  WETH,
  BAL,
  FactoryVersion: JSON.stringify({ name: 'ComposableStablePoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'ComposableStablePool', ...BaseVersion }),
};
