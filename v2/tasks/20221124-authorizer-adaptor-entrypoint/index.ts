import { Task, TaskRunOptions } from '@src';
import { AuthorizerAdaptorEntrypointDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as AuthorizerAdaptorEntrypointDeployment;

  const args = [input.AuthorizerAdaptor];
  await task.deployAndVerify('AuthorizerAdaptorEntrypoint', args, from, force);
};
