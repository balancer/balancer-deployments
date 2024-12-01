import { Task, TaskRunOptions } from '@src';
import { StakelessGaugeCheckpointerDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as StakelessGaugeCheckpointerDeployment;

  const args = [input.GaugeAdder, input.AuthorizerAdaptorEntrypoint];
  await task.deployAndVerify('StakelessGaugeCheckpointer', args, from, force);
};
