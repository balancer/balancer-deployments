import { ERC4626CowSwapFeeBurnerDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as ERC4626CowSwapFeeBurnerDeployment;

  const args = [input.ProtocolFeeSweeper, input.ComposableCow, input.CowVaultRelayer, input.AppDataHash, input.Version];
  await task.deployAndVerify('ERC4626CowSwapFeeBurner', args, from, force);
};
