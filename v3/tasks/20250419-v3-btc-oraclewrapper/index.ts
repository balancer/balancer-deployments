import { Task, TaskRunOptions } from '@src';
import { QuantAMMDeploymentInputParams } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as QuantAMMDeploymentInputParams;

  await task.deployAndVerify('ChainlinkOracle', [input.ChainlinkDataFeedBTC], from, force);
};
