import { Task, TaskMode } from '@src';

export type StableLPOracleDeployment = {
  Vault: string;
  FactoryVersion: string;
  OracleVersion: string;
  MockStablePool: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const MockStablePool = new Task('20250324-v3-stable-pool-v2', TaskMode.READ_ONLY);
const OracleVersion = 0;

const BaseVersion = { version: 0, deployment: '20250815-v3-stable-pool-oracle' };

export default {
  Vault,
  FactoryVersion: JSON.stringify({ name: 'StableLPOracleFactory', ...BaseVersion }),
  OracleVersion,
  MockStablePool,
};
