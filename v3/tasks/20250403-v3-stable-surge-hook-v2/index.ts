import { Task, TaskRunOptions } from '@src';
import { StableSurgeHookDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as StableSurgeHookDeployment;

  const args = [
    input.Vault,
    input.DefaultMaxSurgeFeePercentage,
    input.DefaultSurgeThresholdPercentage,
    input.HookVersion,
  ];
  await task.deployAndVerify('StableSurgeHook', args, from, force);
};
