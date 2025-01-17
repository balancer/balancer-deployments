import { BalancerContractRegistryDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as BalancerContractRegistryDeployment;

  await task.deployAndVerify('BalancerContractRegistry', [input.Vault], from, force);
};
