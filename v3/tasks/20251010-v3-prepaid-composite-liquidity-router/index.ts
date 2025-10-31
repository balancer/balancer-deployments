import { ZERO_ADDRESS } from '@helpers/constants';
import { CompositeLiquidityRouter } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as CompositeLiquidityRouter;

  // Pass the zero address to Permit2 to make this an "aggregator" (prepaid) Router.
  const routerArgs = [input.Vault, input.WETH, ZERO_ADDRESS, input.CompositeLiquidityRouterVersion];
  await task.deployAndVerify('CompositeLiquidityRouter', routerArgs, from, force);
};
