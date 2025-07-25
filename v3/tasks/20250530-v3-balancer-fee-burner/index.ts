import { BalancerFeeBurnerDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as BalancerFeeBurnerDeployment;

  const args = [input.Vault, input.ProtocolFeeSweeper, input.InitialOwner];
  await task.deployAndVerify('BalancerFeeBurner', args, from, force);
};
