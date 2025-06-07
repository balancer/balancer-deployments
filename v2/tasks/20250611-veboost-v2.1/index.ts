import { Task, TaskRunOptions } from '@src';
import { VeBoostV21Deployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as VeBoostV21Deployment;

  const args = [input.VotingEscrow, input.PreseededBoostCalls, input.PreseededApprovalCalls];

  await task.deploy('VeBoostV2', args, from, force);
};
