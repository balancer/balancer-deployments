import { Task, TaskMode } from '@src';

export type GaugeAdderDeployment = {
  GaugeController: string;
};

const GaugeController = new Task('20220325-gauge-controller', TaskMode.READ_ONLY);

export default {
  GaugeController,
};
