import { Task, TaskRunOptions } from '@src';
import { VaultExplorerV2Deployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as VaultExplorerV2Deployment;

  await task.deployAndVerify('VaultExplorer', [input.Vault], from, force);
};
