import { Task, TaskMode } from '@src';

export type CowSwapFeeBurnerDeployment = {
  Vault: string;
  AppDataHash: string;
  ComposableCow: string;
  CowVaultRelayer: string;
  Version: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);

/*
NOTE: AppDataHash was encoded here: https://explorer.cow.fi/appdata?tab=encode

AppData:
{
  "appCode": "{\"name\":\"CowSwapFeeBurner\",\"version\":1,\"deployment\":\"20250221-v3-cow-swap-fee-burner\"}",
  "metadata": {
    "hooks": {
      "version": "0.1.0"
    }
  },
  "version": "1.3.0"
}
*/
const AppDataHash = '0xc800f61d18fc71c6da4c62377e0b2e94eddde7f5bdcd978d0aa501098e30f427';
const ComposableCow = '0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74';
const CowVaultRelayer = '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110';
const Version = JSON.stringify({
  name: 'CowSwapFeeBurner',
  version: 1,
  deployment: '20250221-v3-cow-swap-fee-burner',
});

console.log('Vault:', Version);

export default {
  Vault,
  ComposableCow,
  CowVaultRelayer,
  AppDataHash,
  Version,
};
