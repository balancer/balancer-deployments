import { Task, TaskMode } from '@src';

export type CowSwapFeeBurnerDeployment = {
  ProtocolFeeSweeper: string;
  AppDataHash: string;
  ComposableCow: string;
  CowVaultRelayer: string;
  InitialOwner: string;
  Version: string;
};

// NOTE: AppDataHash was encoded here: https://explorer.cow.fi/appdata?tab=encode
// - App code: `CowSwapFeeBurner-V2`
// - App Data String: `{"appCode":"CowSwapFeeBurner-V2","metadata":{"hooks":{"version":"0.1.0"}},"version":"1.3.0"}`
const AppDataHash = '0x88745ca0e311940750ba181641eec0b17adc53e3d3ae3359a5a23e84bf2ba0a9';

const ProtocolFeeSweeper = new Task('20250503-v3-protocol-fee-sweeper-v2', TaskMode.READ_ONLY);
// ComposableCow and CowVaultRelayer have the same address in every chain.
const ComposableCow = '0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74';
const CowVaultRelayer = '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110';
const Version = JSON.stringify({
  name: 'CowSwapFeeBurner',
  version: 2,
  deployment: '20250530-v3-cow-swap-fee-burner',
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
