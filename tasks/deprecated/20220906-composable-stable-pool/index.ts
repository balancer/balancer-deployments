import { Task, TaskRunOptions } from '@src';
import { ComposableStablePoolDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as ComposableStablePoolDeployment;

  const args = [input.Vault, input.ProtocolFeePercentagesProvider];
  await task.deployAndVerify('ComposableStablePoolFactory', args, from, force);
};
