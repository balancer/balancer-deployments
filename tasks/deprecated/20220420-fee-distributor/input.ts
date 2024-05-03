import { Task, TaskMode } from '@src';

export type FeeDistributorDeployment = {
  VotingEscrow: string;
  startTime: number;
};

const VotingEscrow = new Task('20220325-gauge-controller', TaskMode.READ_ONLY);

export default {
  VotingEscrow,
  mainnet: {
    startTime: 1649894400, // Thursday, April 14, 2022 00:00:00 UTC
  },
};
