import { Task, TaskRunOptions } from '@src';
import { DoubleEntrypointFixRelayerDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as DoubleEntrypointFixRelayerDeployment;

  const args = [input.Vault];
  await task.deployAndVerify('DoubleEntrypointFixRelayer', args, from, force);
};
