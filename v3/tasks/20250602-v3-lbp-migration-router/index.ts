import { LBPMigrationRouterDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as LBPMigrationRouterDeployment;

  const args = [input.BalancerContractRegistry, input.Version];
  await task.deployAndVerify('LBPMigrationRouter', args, from, force);
};
