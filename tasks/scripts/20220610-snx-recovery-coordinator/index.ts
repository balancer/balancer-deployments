import { Task, TaskRunOptions } from '@src';
import { SNXRecoveryCoordinatorDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as SNXRecoveryCoordinatorDeployment;

  const args = [input.AuthorizerAdaptor, input.ProtocolFeesWithdrawer, input.tokens, input.amounts];
  await task.deployAndVerify('SNXRecoveryCoordinator', args, from, force);
};
