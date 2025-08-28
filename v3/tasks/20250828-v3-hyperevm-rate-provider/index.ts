import { HyperEVMRateProviderFactoryDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as HyperEVMRateProviderFactoryDeployment;

  await task.deployAndVerify(
    'HyperEVMRateProviderFactory',
    [input.Vault, input.FactoryVersion, input.RateProviderVersion],
    from,
    force
  );
};
