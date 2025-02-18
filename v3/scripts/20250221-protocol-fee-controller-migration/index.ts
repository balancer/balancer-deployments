import { Task, TaskRunOptions } from '@src';
import { BalancerContractRegistryInitializerDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as BalancerContractRegistryInitializerDeployment;

  const args = [
    input.Vault,
    input.BalancerContractRegistry,
    [input.RouterName, input.BatchRouterName, input.BufferRouterName, input.CompositeLiquidityRouterName],
    [input.Router, input.BatchRouter, input.BufferRouter, input.CompositeLiquidityRouter],
    [input.WeightedPoolName, input.StablePoolName, input.StableSurgePoolName],
    [input.WeightedPoolFactory, input.StablePoolFactory, input.StableSurgePoolFactory],
    [input.WeightedPoolAlias, input.StablePoolAlias],
    [input.WeightedPoolFactory, input.StablePoolFactory],
  ];

  await task.deployAndVerify('BalancerContractRegistryInitializer', args, from, force);
};
