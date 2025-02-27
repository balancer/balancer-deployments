import { Task, TaskMode } from '@src';

export type CowSwapFeeBurnerDeployment = {
  Vault: string;
  AppData: string;
  ComposableCow: string;
  CowVaultRelayer: string;
  Version: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);

//TODO: Set our own app data before deployment. https://explorer.cow.fi/appdata?tab=encode
const AppData = '0xc990bae86208bfdfba8879b64ab68da5905e8bb97aa3da5c701ec1183317a6f6';
const ComposableCow = '0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74';
const CowVaultRelayer = '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110';
const Version = JSON.stringify({
  name: 'CowSwapFeeBurner',
  version: 1,
  deployment: '20250221-v3-cow-swap-fee-burner',
});

export default {
  Vault,
  ComposableCow,
  CowVaultRelayer,
  AppData,
  Version,
};
