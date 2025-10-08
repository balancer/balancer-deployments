import { Task, TaskMode } from '@src';

export type AggregatorBatchRouterDeployment = {
  Vault: string;
  WETH: string;
  BatchRouterVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);

const BaseVersion = { version: 2, deployment: '20251010-v3-aggregator-batch-router-v2' };

export default {
  Vault,
  WETH,
  BatchRouterVersion: JSON.stringify({ name: 'AggregatorBatchRouter', ...BaseVersion }),
};
