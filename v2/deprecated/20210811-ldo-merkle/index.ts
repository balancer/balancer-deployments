import { Task, TaskRunOptions } from '@src';
import { MerkleRedeemDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as MerkleRedeemDeployment;

  const args = [input.Vault, input.ldoToken];
  await task.deployAndVerify('MerkleRedeem', args, from, force);
};
