import { Task, TaskRunOptions } from '@src';
import { ProtocolFeePercentagesProviderDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as ProtocolFeePercentagesProviderDeployment;

  const args = [input.Vault, input.BalancerContractRegistry];

  await task.deployAndVerify('ProtocolFeePercentagesProvider', args, from, force);
};
