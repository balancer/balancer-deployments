import { Task, TaskRunOptions } from '@src';
import { LidoRelayerDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as LidoRelayerDeployment;

  const relayerArgs = [input.Vault, input.wstETH];
  await task.deployAndVerify('LidoRelayer', relayerArgs, from, force);
};
