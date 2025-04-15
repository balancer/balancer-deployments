import { Task, TaskRunOptions } from '@src';
import { WrappedBPTDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as WrappedBPTDeployment;

  await task.deployAndVerify('WrappedBalancerPoolTokenFactory', [input.Vault], from, force);
};
