import { Task, TaskMode } from '@src';

export type L2GaugeCheckpointerDeployment = {
  GaugeAdder: string;
  AuthorizerAdaptorEntrypoint: string;
};

const GaugeAdder = new Task('20230519-gauge-adder-v4', TaskMode.READ_ONLY);
const AuthorizerAdaptorEntrypoint = new Task('20221124-authorizer-adaptor-entrypoint', TaskMode.READ_ONLY);

export default {
  GaugeAdder,
  AuthorizerAdaptorEntrypoint,
};
