import { Task, TaskRunOptions } from '@src';
import { SmartWalletCheckerDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as SmartWalletCheckerDeployment;

  const args = [input.Vault, input.InitialAllowedAddresses];
  await task.deployAndVerify('SmartWalletChecker', args, from, force);
};
