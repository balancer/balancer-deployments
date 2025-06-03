import { LBPMigrationRouterDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as LBPMigrationRouterDeployment;

  const args = [input.Vault, input.WeightedPoolFactory, input.Treasury];
  await task.deployAndVerify('LBPMigrationRouter', args, from, force);
};
