import { BufferRouterDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as BufferRouterDeployment;

  const routerArgs = [input.Vault, input.WETH, input.Permit2, input.BufferRouterVersion];
  await task.deployAndVerify('BufferRouter', routerArgs, from, force);
};
