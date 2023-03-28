import { Task, TaskRunOptions } from '@src';
import { StablePhantomPoolDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as StablePhantomPoolDeployment;
  const args = [input.Vault];
  await task.deployAndVerify('StablePhantomPoolFactory', args, from, force);
};
