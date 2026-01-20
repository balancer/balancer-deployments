import { ProtocolFeeHelperDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as ProtocolFeeHelperDeployment;

  await task.deployAndVerify('ProtocolFeeHelper', [input.Vault, input.HelperAdmin], from, force);
};
