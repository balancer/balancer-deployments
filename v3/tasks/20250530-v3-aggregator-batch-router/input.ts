import { Task, TaskMode } from '@src';

export type AggregatorBatchRouterDeployment = {
  Vault: string;
  BatchRouterVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const BaseVersion = { version: 1, deployment: '20250530-v3-aggregator-batch-router' };

export default {
  Vault,
  BatchRouterVersion: JSON.stringify({ name: 'AggregatorBatchRouter', ...BaseVersion }),
};
