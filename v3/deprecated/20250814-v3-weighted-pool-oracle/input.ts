import { Task, TaskMode } from '@src';

export type WeightedLPOracleDeployment = {
  Vault: string;
  ConstantPriceFeed: string;
  FactoryVersion: string;
  OracleVersion: string;
  MockWeightedPool: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const ConstantPriceFeed = new Task('20250813-v3-constant-price-feed', TaskMode.READ_ONLY);
const MockWeightedPool = new Task('20241205-v3-weighted-pool', TaskMode.READ_ONLY);
const OracleVersion = 0;

const BaseVersion = { version: 0, deployment: '20250814-v3-weighted-pool-oracle' };

export default {
  Vault,
  ConstantPriceFeed,
  FactoryVersion: JSON.stringify({ name: 'WeightedLPOracleFactory', ...BaseVersion }),
  OracleVersion,
  MockWeightedPool,
};
