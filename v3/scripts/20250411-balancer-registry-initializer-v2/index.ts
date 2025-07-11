import { Task, TaskRunOptions } from '@src';
import { BalancerContractRegistryInitializerDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as BalancerContractRegistryInitializerDeployment;

  const args = [
    input.Vault,
    input.BalancerContractRegistry,
    [
      input.RouterName,
      input.BatchRouterName,
      input.BufferRouterName,
      input.CompositeLiquidityRouterName,
      input.AggregatorRouterName,
      input.AggregatorBatchRouterName,
    ],
    [
      input.Router,
      input.BatchRouter,
      input.BufferRouter,
      input.CompositeLiquidityRouter,
      input.AggregatorRouter,
      input.AggregatorBatchRouter,
    ],
    [
      input.WeightedPoolName,
      input.StablePoolName,
      input.StableSurgePoolName,
      input.Gyro2CLPName,
      input.GyroECLPName,
      input.ReClammPoolName,
    ],
    [
      input.WeightedPoolFactory,
      input.StablePoolFactory,
      input.StableSurgePoolFactory,
      input.Gyro2CLPPoolFactory,
      input.GyroECLPPoolFactory,
      input.ReClammPoolFactory,
    ],
    [
      input.WeightedPoolAlias,
      input.StablePoolAlias,
      input.StableSurgePoolAlias,
      input.RouterAlias,
      input.BatchRouterAlias,
      input.CompositeLiquidityRouterAlias,
      input.AggregatorRouterAlias,
      input.AggregatorBatchRouterAlias,
      input.Gyro2CLPAlias,
      input.GyroECLPAlias,
      input.ReClammAlias,
    ],
    [
      input.WeightedPoolFactory,
      input.StablePoolFactory,
      input.StableSurgePoolFactory,
      input.Router,
      input.BatchRouter,
      input.CompositeLiquidityRouter,
      input.AggregatorRouter,
      input.AggregatorBatchRouter,
      input.Gyro2CLPPoolFactory,
      input.GyroECLPPoolFactory,
      input.ReClammPoolFactory,
    ],
  ];

  await task.deployAndVerify('BalancerContractRegistryInitializer', args, from, force);
};
