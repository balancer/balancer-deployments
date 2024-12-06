import { BatchRouterDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as BatchRouterDeployment;

  const routerArgs = [input.Vault, input.WETH, input.Permit2, input.BatchRouterVersion];
  await task.deployAndVerify('BatchRouter', routerArgs, from, force);
};
