import { MevCaptureHookDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as MevCaptureHookDeployment;

  const args = [
    input.Vault,
    input.BalancerContractRegistry,
    input.DefaultMevTaxMultiplier,
    input.DefaultMevTaxThreshold,
  ];
  await task.deployAndVerify('MevCaptureHook', args, from, force);
};
