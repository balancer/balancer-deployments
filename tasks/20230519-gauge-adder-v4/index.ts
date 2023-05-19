import { Task, TaskRunOptions } from '@src';
import { GaugeAdderDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as GaugeAdderDeployment;

  const gaugeAdderArgs = [input.GaugeController, input.AuthorizerAdaptorEntrypoint];
  await task.deployAndVerify('GaugeAdder', gaugeAdderArgs, from, force);
};
