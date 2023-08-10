import { Task, TaskRunOptions } from '@src';
import { AvalancheRootGaugeFactoryDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as AvalancheRootGaugeFactoryDeployment;

  const args = [input.Vault, input.BalancerMinter, input.BALProxy];

  const factory = await task.deployAndVerify('AvalancheRootGaugeFactory', args, from, force);

  const implementation = await factory.getGaugeImplementation();
  await task.verify('AvalancheRootGauge', implementation, [input.BalancerMinter, input.BALProxy]);
  task.save({ AvalancheRootGauge: implementation });
};
