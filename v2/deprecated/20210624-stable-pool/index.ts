import { Task, TaskRunOptions } from '@src';
import { StablePoolDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as StablePoolDeployment;
  const args = [input.Vault];
  await task.deployAndVerify('StablePoolFactory', args, from, force);
};
