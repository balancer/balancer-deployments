import { Task, TaskMode } from '@src';

export type CowSwapFeeBurnerDeployment = {
  Vault: string;
  AppData: string;
  ComposableCow: string;
  CowVaultRelayer: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);

//TODO: change app data before mainnet deployment
const AppData = '0xc990bae86208bfdfba8879b64ab68da5905e8bb97aa3da5c701ec1183317a6f6';
const ComposableCow = '0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74';
const CowVaultRelayer = '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110';

export default {
  Vault,
  ComposableCow,
  CowVaultRelayer,
  AppData,
};
