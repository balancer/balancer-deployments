import { HookExamplesDeployment as MevTaxHookDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as MevTaxHookDeployment;

  const args = [input.Vault, input.BalancerContractRegistry];
  await task.deployAndVerify('MevTaxHook', args, from, force);
};
