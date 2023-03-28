import { Task, TaskRunOptions } from '@src';
import { WeightedPoolDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as WeightedPoolDeployment;

  const args = [input.Vault, input.ProtocolFeePercentagesProvider];
  await task.deployAndVerify('WeightedPoolFactory', args, from, force);
};
