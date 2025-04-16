import { fp } from '@helpers/numbers';
import { Task, TaskMode } from '@src';

export type StableSurgeHookDeployment = {
  Vault: string;
  DefaultMaxSurgeFeePercentage: bigint;
  DefaultSurgeThresholdPercentage: bigint;
  HookVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);

const DefaultMaxSurgeFeePercentage = fp(0.95);
const DefaultSurgeThresholdPercentage = fp(0.3);

const BaseVersion = { version: 2, deployment: '20250403-v3-stable-surge-hook-v2' };

export default {
  Vault,
  DefaultMaxSurgeFeePercentage,
  DefaultSurgeThresholdPercentage,
  HookVersion: JSON.stringify({ name: 'StableSurgeHook', ...BaseVersion }),
};
