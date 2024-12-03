import { Task, TaskRunOptions } from '@src';
import { MerkleRedeemDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  if (task.network != 'arbitrum')
    throw new Error('Attempting to deploy MCDEX MerkleRedeem on the wrong network (should be arbitrum)');
  const input = task.input() as MerkleRedeemDeployment;

  const args = [input.Vault, input.rewardToken];
  await task.deployAndVerify('MerkleRedeem', args, from, force);
};
