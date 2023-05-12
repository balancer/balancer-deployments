import { Task, TaskRunOptions } from '@src';
import { LiquidityGaugeFactoryDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as LiquidityGaugeFactoryDeployment;

  const gaugeImplementationArgs = [input.BalancerMinter, input.VotingEscrowDelegationProxy, input.AuthorizerAdaptor];
  const gaugeImplementation = await task.deploy('LiquidityGaugeV5', gaugeImplementationArgs, from, force);

  const args = [gaugeImplementation.address];
  await task.deployAndVerify('LiquidityGaugeFactory', args, from, force);
};
