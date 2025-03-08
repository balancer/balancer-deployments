import { Task, TaskRunOptions } from '@src';
import { BalancerContractRegistryInitializerDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as BalancerContractRegistryInitializerDeployment;

  const args = [
    input.Vault,
    input.BalancerContractRegistry,
    [input.RouterName, input.BatchRouterName, input.BufferRouterName, input.CompositeLiquidityRouterName],
    [input.Router, input.BatchRouter, input.BufferRouter, input.CompositeLiquidityRouter],
    [input.WeightedPoolName, input.StablePoolName, input.StableSurgePoolName, input.LBPoolName],
    [input.WeightedPoolFactory, input.StablePoolFactory, input.StableSurgePoolFactory, input.LBPoolFactory],
    [input.WeightedPoolAlias, input.StablePoolAlias, input.RouterAlias, input.BatchRouterAlias],
    [input.WeightedPoolFactory, input.StablePoolFactory, input.Router, input.BatchRouter],
  ];

  await task.deployAndVerify('BalancerContractRegistryInitializer', args, from, force);
};
