import { Task, TaskMode } from '@src';

export type AggregatorRouterDeployment = {
  Vault: string;
  RouterVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const BaseVersion = { version: 1, deployment: '20250218-v3-aggregator-router' };

export default {
  Vault,
  RouterVersion: JSON.stringify({ name: 'AggregatorRouter', ...BaseVersion }),
};
