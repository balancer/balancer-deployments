import { Task, TaskMode } from '@src';

export type HyperEVMRateProviderFactoryDeployment = {
  Vault: string;
  FactoryVersion: string;
  RateProviderVersion: number;
  ExampleTokenIndex: number;
  ExamplePairIndex: number;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);

const BaseVersion = { version: 1, deployment: '20250828-v3-hyperevm-rate-provider' };
const RateProviderVersion = 1;

export default {
  Vault,
  FactoryVersion: JSON.stringify({ name: 'HyperEVMRateProviderFactory', ...BaseVersion }),
  RateProviderVersion,
  ExampleTokenIndex: 1,
  ExamplePairIndex: 0,
};
