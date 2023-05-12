import { Task, TaskRunOptions } from '@src';
import { TribeBALMinterCoordinatorDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as TribeBALMinterCoordinatorDeployment;

  const args = [input.AuthorizerAdaptor];
  await task.deployAndVerify('TribeBALMinterCoordinator', args, from, force);
};
