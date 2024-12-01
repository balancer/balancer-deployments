import { ZERO_ADDRESS } from '@helpers/constants';
import { Task, TaskRunOptions } from '@src';
import { L2VotingEscrowDelegationProxyDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as L2VotingEscrowDelegationProxyDeployment;

  const nullVotingEscrow = await task.deployAndVerify('NullVotingEscrow', [], from, force);

  const veDelegationProxyArgs = [input.Vault, nullVotingEscrow.address, ZERO_ADDRESS];
  await task.deployAndVerify('VotingEscrowDelegationProxy', veDelegationProxyArgs, from, force);
};
