import { Task, TaskRunOptions } from '@src';
import { VotingEscrowDelegationDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as VotingEscrowDelegationDeployment;

  const args = [input.VotingEscrow, 'VotingEscrow Delegation', 'veBoost', '', input.AuthorizerAdaptor];
  const votingEscrowDelegation = await task.deploy('VotingEscrowDelegation', args, from);

  const proxyArgs = [input.Vault, input.VotingEscrow, votingEscrowDelegation.address];
  await task.deployAndVerify('VotingEscrowDelegationProxy', proxyArgs, from, force);
};
