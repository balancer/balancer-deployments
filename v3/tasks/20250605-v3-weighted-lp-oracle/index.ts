import { WeightedLPOracleDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as WeightedLPOracleDeployment;

  const args = [input.Vault, input.Version];
  await task.deployAndVerify('WeightedLPOracleFactory', args, from, force);
};
