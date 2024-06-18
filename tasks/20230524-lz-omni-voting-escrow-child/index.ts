import { Task, TaskRunOptions } from '@src';
import { OmniVotingChildEscrowDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as OmniVotingChildEscrowDeployment;

  const args = [input.LayerZeroEndpoint, input.L2LayerZeroBridgeForwarder];
  await task.deployAndVerify('OmniVotingEscrowChild', args, from, force);
};
