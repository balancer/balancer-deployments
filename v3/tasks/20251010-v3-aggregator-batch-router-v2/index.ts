import { ZERO_ADDRESS } from '@helpers/constants';
import { AggregatorBatchRouterDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as AggregatorBatchRouterDeployment;

  // Deploy with the zero address for Permit2 to indicate this is a prepaid version.
  const routerArgs = [input.Vault, input.WETH, ZERO_ADDRESS, input.BatchRouterVersion];
  await task.deployAndVerify('BatchRouter', routerArgs, from, force);
};
