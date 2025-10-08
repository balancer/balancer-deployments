import { AggregatorBatchRouterDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as AggregatorBatchRouterDeployment;

  const routerArgs = [input.Vault, input.BatchRouterVersion];
  await task.deployAndVerify('AggregatorBatchRouter', routerArgs, from, force);
};
