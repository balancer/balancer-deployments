import { Task, TaskRunOptions } from '@src';
import { BalancerQueriesDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as BalancerQueriesDeployment;

  const args = [input.Vault];
  await task.deployAndVerify('BalancerQueries', args, from, force);
};
