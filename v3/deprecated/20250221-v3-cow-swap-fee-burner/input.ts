import { Task, TaskMode } from '@src';

export type CowSwapFeeBurnerDeployment = {
  Vault: string;
  AppDataHash: string;
  ComposableCow: string;
  CowVaultRelayer: string;
  Version: string;
};

// NOTE: AppDataHash was encoded here: https://explorer.cow.fi/appdata?tab=encode
// - App code: `CowSwapFeeBurner-V1`
// - App Data String: `{"appCode":"CowSwapFeeBurner-V1","metadata":{"hooks":{"version":"0.1.0"}},"version":"1.3.0"}`
const AppDataHash = '0xa1d3c92b8e24bc826f9023b7ec18ca1387849e8eeb3016602d49a07c49200c3d';

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
// ComposableCow and CowVaultRelayer have the same address in every chain.
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
  AppDataHash,
  Version,
};
