import { Task, TaskRunOptions } from '@src';
import { veBALDeploymentCoordinatorDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as veBALDeploymentCoordinatorDeployment;

  const args = [
    input.BalancerMinter,
    input.AuthorizerAdaptor,
    input.GaugeAdder,
    input.LiquidityGaugeFactory,
    input.SingleRecipientGaugeFactory,
    input.BALTokenHolderFactory,
    input.activationScheduledTime,
    input.thirdStageDelay,
  ];
  await task.deployAndVerify('veBALDeploymentCoordinator', args, from, force);
};
