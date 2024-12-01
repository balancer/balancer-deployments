import { Task, TaskRunOptions } from '@src';
import { BalancerPoolDataQueriesDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as BalancerPoolDataQueriesDeployment;

  const args = [input.Vault];
  await task.deployAndVerify('BalancerPoolDataQueries', args, from, force);
};
