import { Task, TaskRunOptions } from '@src';
import { WstETHRateProviderDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as WstETHRateProviderDeployment;

  const rateProviderArgs = [input.wstETH];
  await task.deployAndVerify('WstETHRateProvider', rateProviderArgs, from, force);
};
