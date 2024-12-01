import { Task, TaskRunOptions } from '@src';
import { ERC4626LinearPoolDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as ERC4626LinearPoolDeployment;
  const args = [input.Vault];
  await task.deployAndVerify('ERC4626LinearPoolFactory', args, from, force);
};
