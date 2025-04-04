import { Task, TaskRunOptions } from '@src';
import { VaultExplorerDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as VaultExplorerDeployment;

  await task.deployAndVerify('VaultExplorer', [input.Vault], from, force);
};
