import { Network, NETWORKS, Task, TaskMode } from '@src';
import hre from 'hardhat';

export type LBPMigrationRouterDeployment = {
  Vault: string;
  WeightedPoolFactory: string;
  Treasury: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const WeightedPoolFactory = new Task('20241205-v3-weighted-pool', TaskMode.READ_ONLY);
const Treasury = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

export default {
  Vault,
  WeightedPoolFactory,
  Treasury,
};
