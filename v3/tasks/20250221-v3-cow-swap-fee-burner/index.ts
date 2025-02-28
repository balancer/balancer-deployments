import { CowSwapFeeBurnerDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as CowSwapFeeBurnerDeployment;

  const routerArgs = [input.Vault, input.ComposableCow, input.CowVaultRelayer, input.AppDataHash, input.Version];
  await task.deployAndVerify('CowSwapFeeBurner', routerArgs, from, force);
};
