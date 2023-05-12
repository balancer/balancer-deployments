import { Task, TaskMode } from '@src';

export type SingleRecipientFactoryDelegationDeployment = {
  BalancerMinter: string;
};

const BalancerMinter = new Task('20220325-gauge-controller', TaskMode.READ_ONLY);

export default {
  BalancerMinter,
};
