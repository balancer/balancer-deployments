import { AggregatorRouterDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as AggregatorRouterDeployment;

  const routerArgs = [input.Vault, input.RouterVersion];
  await task.deployAndVerify('AggregatorRouter', routerArgs, from, force);
};
