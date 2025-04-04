import { Task, TaskRunOptions } from '@src';
import { BalancerContractRegistryInitializerDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as BalancerContractRegistryInitializerDeployment;

  const args = [
    input.Vault,
    input.BalancerContractRegistry,
    [input.RouterName, input.BatchRouterName, input.BufferRouterName, input.CompositeLiquidityRouterName],
    [input.Router, input.BatchRouter, input.BufferRouter, input.CompositeLiquidityRouter],
    [
      input.WeightedPoolName,
      input.StablePoolName,
      input.StableSurgePoolName,
      input.LBPoolName,
      input.Gyro2CLPName,
      input.GyroECLPName,
    ],
    [
      input.WeightedPoolFactory,
      input.StablePoolFactory,
      input.StableSurgePoolFactory,
      input.LBPoolFactory,
      input.Gyro2CLPPoolFactory,
      input.GyroECLPPoolFactory,
    ],
    [
      input.WeightedPoolAlias,
      input.StablePoolAlias,
      input.StableSurgePoolAlias,
      input.RouterAlias,
      input.BatchRouterAlias,
      input.Gyro2CLPAlias,
      input.GyroECLPAlias,
    ],
    [
      input.WeightedPoolFactory,
      input.StablePoolFactory,
      input.StableSurgePoolFactory,
      input.Router,
      input.BatchRouter,
      input.Gyro2CLPPoolFactory,
      input.GyroECLPPoolFactory,
    ],
  ];

  await task.deployAndVerify('BalancerContractRegistryInitializer', args, from, force);
};
