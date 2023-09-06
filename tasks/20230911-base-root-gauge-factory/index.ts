import { Task, TaskRunOptions } from '@src';
import { BaseRootGaugeFactoryDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as BaseRootGaugeFactoryDeployment;

  const args = [input.Vault, input.BalancerMinter, input.L1StandardBridge, input.BaseBAL];

  const factory = await task.deployAndVerify('BaseRootGaugeFactory', args, from, force);

  const implementation = await factory.getGaugeImplementation();
  await task.verify('BaseRootGauge', implementation, [input.BalancerMinter, input.L1StandardBridge, input.BaseBAL]);
  task.save({ BaseRootGauge: implementation });
};
