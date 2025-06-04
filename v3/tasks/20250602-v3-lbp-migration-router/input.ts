import { Task, TaskMode } from '@src';

export type LBPMigrationRouterDeployment = {
  BalancerContractRegistry: string;
  Version: string;
};

const BalancerContractRegistry = new Task('20250117-v3-contract-registry', TaskMode.READ_ONLY);
const Version = JSON.stringify({
  name: 'LBPMigrationRouter',
  version: 1,
  deployment: '20250602-v3-lbp-migration-router',
});

export default {
  BalancerContractRegistry,
  Version,
};
