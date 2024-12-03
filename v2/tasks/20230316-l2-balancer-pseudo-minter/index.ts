import { Task, TaskRunOptions } from '@src';
import { L2BalancerPseudoMinterDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as L2BalancerPseudoMinterDeployment;

  await task.deployAndVerify('L2BalancerPseudoMinter', [input.Vault, input.BAL], from, force);
};
