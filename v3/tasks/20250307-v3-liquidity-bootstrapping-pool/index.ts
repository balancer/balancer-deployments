import { LBPoolFactoryDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as LBPoolFactoryDeployment;

  const args = [input.Vault, input.PauseWindowDuration, input.FactoryVersion, input.PoolVersion, input.Router];

  await task.deployAndVerify('LBPoolFactory', args, from, force);
};
