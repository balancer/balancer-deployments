import { Task, TaskRunOptions } from '@src';
import { SmartWalletCheckerCoordinatorDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as SmartWalletCheckerCoordinatorDeployment;

  const args = [input.AuthorizerAdaptor, input.VotingEscrow, input.SmartWalletChecker];
  await task.deployAndVerify('SmartWalletCheckerCoordinator', args, from, force);
};
