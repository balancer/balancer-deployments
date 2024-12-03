import { Task, TaskRunOptions } from '@src';
import { OmniVotingEscrowDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as OmniVotingEscrowDeployment;

  const args = [input.LayerZeroEndpoint, input.VotingEscrowRemapper];
  await task.deployAndVerify('OmniVotingEscrow', args, from, force);
};
