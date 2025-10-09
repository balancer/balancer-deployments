import { AddViaSwapRouterDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as AddViaSwapRouterDeployment;

  const routerArgs = [input.Vault, input.Permit2, input.WETH, input.RouterVersion];
  await task.deployAndVerify('UnbalancedAddViaSwapRouter', routerArgs, from, force);
};
