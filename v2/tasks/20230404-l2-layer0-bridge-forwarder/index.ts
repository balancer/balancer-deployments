import { L2Layer0BridgeForwarderDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as L2Layer0BridgeForwarderDeployment;
  await task.deployAndVerify('L2LayerZeroBridgeForwarder', [input.Vault], from, force);
};
