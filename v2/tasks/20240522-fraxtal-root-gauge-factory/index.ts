import { Task, TaskRunOptions } from '@src';
import { FraxtalRootGaugeFactoryDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as FraxtalRootGaugeFactoryDeployment;

  const args = [
    input.Vault,
    input.BalancerMinter,
    input.L1StandardBridge,
    input.FraxtalBAL,
    input.GasLimit,
    input.Network,
  ];

  const factory = await task.deployAndVerify('OptimisticRootGaugeFactory', args, from, force);

  const implementation = await factory.getGaugeImplementation();
  await task.verify('OptimisticRootGauge', implementation, [
    input.BalancerMinter,
    input.L1StandardBridge,
    input.FraxtalBAL,
  ]);
  await task.save({ OptimisticRootGauge: implementation });
};
