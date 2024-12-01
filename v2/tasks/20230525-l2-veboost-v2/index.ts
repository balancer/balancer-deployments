import { Task, TaskRunOptions } from '@src';
import { L2VeBoostV2Deployment } from './input';
import { ZERO_ADDRESS } from '@helpers/constants';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as L2VeBoostV2Deployment;

  const args = [ZERO_ADDRESS, input.VotingEscrow];

  await task.deploy('VeBoostV2', args, from, force);
};
