import { Task, TaskMode } from '@src';

export type ERC4626CowSwapFeeBurnerDeployment = {
  ProtocolFeeSweeper: string;
  AppDataHash: string;
  ComposableCow: string;
  CowVaultRelayer: string;
  InitialOwner: string;
  Version: string;
};

// NOTE: AppDataHash was encoded here: https://explorer.cow.fi/appdata?tab=encode
// - App code: `ERC4626CowSwapFeeBurner-V1`
// - App Data String: `{"appCode":"ERC4626CowSwapFeeBurner-V1","metadata":{"hooks":{"version":"0.1.0"}},"version":"1.3.0"}`
const AppDataHash = '0x8dd3bf08c5ca60bb12d1562636a9fff866261ec4708621832a65374dadd36b0a';

const ProtocolFeeSweeper = new Task('20250228-v3-protocol-fee-sweeper', TaskMode.READ_ONLY);
// ComposableCow and CowVaultRelayer have the same address in every chain.
const ComposableCow = '0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74';
const CowVaultRelayer = '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110';
const Version = JSON.stringify({
  name: 'ERC4626CowSwapFeeBurner',
  version: 2,
  deployment: '20250530-v3-erc4626-cow-swap-fee-burner',
});

// https://github.com/BalancerMaxis/bal_addresses/blob/4b7ab007d01af33f996ae22bc70184f4eca6deeb/extras/signers.json#L72
const InitialOwner = '0x74E283B985EA76c55C8B48d6bD1067a418188424';

export default {
  ProtocolFeeSweeper,
  ComposableCow,
  CowVaultRelayer,
  AppDataHash,
  InitialOwner,
  Version,
};
