import { Task, TaskRunOptions } from '@src';
import { VeBoostV2Deployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as VeBoostV2Deployment;

  const args = [input.PreseededVotingEscrowDelegation, input.VotingEscrow];

  await task.deploy('VeBoostV2', args, from, force);
};
