import { NoProtocolFeeLiquidityBootstrappingPoolDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as NoProtocolFeeLiquidityBootstrappingPoolDeployment;
  const args = [input.Vault];
  await task.deployAndVerify('NoProtocolFeeLiquidityBootstrappingPoolFactory', args, from, force);
};
