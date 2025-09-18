import { PoolPauseHelperDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as PoolPauseHelperDeployment;

  await task.deployAndVerify('PoolPauseHelper', [input.Vault], from, force);
};
