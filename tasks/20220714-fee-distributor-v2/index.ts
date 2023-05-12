import { Task, TaskRunOptions } from '@src';
import { FeeDistributorDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as FeeDistributorDeployment;

  const args = [input.VotingEscrow, input.startTime];
  await task.deployAndVerify('FeeDistributor', args, from, force);
};
