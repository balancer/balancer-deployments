import { Task, TaskRunOptions } from '@src';
import { AuthorizerDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as AuthorizerDeployment;
  const args = [input.admin];
  await task.deployAndVerify('Authorizer', args, from, force);
};
