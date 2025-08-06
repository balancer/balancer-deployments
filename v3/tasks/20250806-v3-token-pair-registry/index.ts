import { TokenPairRegistryDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as TokenPairRegistryDeployment;

  await task.deployAndVerify('TokenPairRegistry', [input.Vault, input.InitialOwner], from, force);
};
