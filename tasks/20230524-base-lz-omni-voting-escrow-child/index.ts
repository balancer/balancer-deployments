import { Task, TaskRunOptions } from '@src';
import { OmniVotingEscrowChildDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as OmniVotingEscrowChildDeployment;

  const args = [input.LayerZeroEndpoint, input.L2LayerZeroBridgeForwarder];
  await task.deployAndVerify('OmniVotingEscrowChild', args, from, force);
};
