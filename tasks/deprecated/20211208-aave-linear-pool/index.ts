import { Task, TaskRunOptions } from '@src';
import { AaveLinearPoolDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as AaveLinearPoolDeployment;
  const args = [input.Vault];
  await task.deployAndVerify('AaveLinearPoolFactory', args, from, force);
};
