import { Task, TaskRunOptions } from '@src';
import { AuthorizerAdaptorDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as AuthorizerAdaptorDeployment;

  const args = [input.Vault];
  await task.deployAndVerify('AuthorizerAdaptor', args, from, force);
};
