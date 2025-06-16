import { ProtocolFeeSweeperDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as ProtocolFeeSweeperDeployment;

  await task.deployAndVerify('ProtocolFeeSweeper', [input.Vault, input.FeeRecipient], from, force);
};
