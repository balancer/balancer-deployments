import { ProtocolFeeControllerDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as ProtocolFeeControllerDeployment;

  await task.deployAndVerify(
    'ProtocolFeeController',
    [input.Vault, input.InitialGlobalProtocolSwapFee, input.InitialGlobalProtocolYieldFee],
    from,
    force
  );
};
