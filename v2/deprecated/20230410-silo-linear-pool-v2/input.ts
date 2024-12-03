import { Task, TaskMode } from '@src';
import { MONTH } from '@helpers/time';

export type SiloLinearPoolDeployment = {
  Vault: string;
  BalancerQueries: string;
  ProtocolFeePercentagesProvider: string;
  WETH: string;
  FactoryVersion: string;
  PoolVersion: string;
  InitialPauseWindowDuration: number;
  BufferPeriodDuration: number;
};

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);
const BalancerQueries = new Task('20220721-balancer-queries', TaskMode.READ_ONLY);
const ProtocolFeePercentagesProvider = new Task('20220725-protocol-fee-percentages-provider', TaskMode.READ_ONLY);
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);

const BaseVersion = { version: 2, deployment: '20230410-silo-linear-pool-v2' };

export default {
  Vault,
  BalancerQueries,
  ProtocolFeePercentagesProvider,
  WETH,
  FactoryVersion: JSON.stringify({ name: 'SiloLinearPoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'SiloLinearPool', ...BaseVersion }),
  InitialPauseWindowDuration: MONTH * 3,
  BufferPeriodDuration: MONTH,
};
