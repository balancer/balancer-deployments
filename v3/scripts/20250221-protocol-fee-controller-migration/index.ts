import { Task, TaskRunOptions } from '@src';
import { ProtocolFeeControllerMigrationDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as ProtocolFeeControllerMigrationDeployment;

  const args = [input.Vault, input.ProtocolFeeController];

  await task.deployAndVerify('ProtocolFeeControllerMigration', args, from, force);

  // Deploy a version of the WeightedPoolFactory that allows pool creators.
  const factoryArgs = [input.Vault, 0, '', ''];
  await task.deployAndVerify('WeightedPoolFactory', factoryArgs, from, force);
};
