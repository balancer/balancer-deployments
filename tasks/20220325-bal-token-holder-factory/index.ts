import { Task, TaskRunOptions } from '@src';
import { BalTokenHolderFactoryDelegationDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as BalTokenHolderFactoryDelegationDeployment;

  const args = [input.BAL, input.Vault];
  await task.deployAndVerify('BALTokenHolderFactory', args, from, force);
};
