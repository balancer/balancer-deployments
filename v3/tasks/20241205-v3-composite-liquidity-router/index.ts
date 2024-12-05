import { RouterDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as RouterDeployment;

  const routerArgs = [input.Vault, input.WETH, input.Permit2];
  await task.deployAndVerify('Router', [...routerArgs, input.RouterVersion], from, force);
  await task.deployAndVerify('BatchRouter', [...routerArgs, input.BatchRouterVersion], from, force);
  await task.deployAndVerify(
    'CompositeLiquidityRouter',
    [...routerArgs, input.CompositeLiquidityRouterVersion],
    from,
    force
  );
  await task.deployAndVerify('BufferRouter', [...routerArgs, input.BufferRouterVersion], from, force);
};
