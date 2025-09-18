import { PoolSwapFeeHelperDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as PoolSwapFeeHelperDeployment;

  await task.deployAndVerify('PoolSwapFeeHelper', [input.Vault, input.HelperAdmin], from, force);
};
