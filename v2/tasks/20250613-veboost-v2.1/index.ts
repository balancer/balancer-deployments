import { Task, TaskRunOptions } from '@src';
import { VeBoostV21Deployment } from './input';
import { ZERO_ADDRESS } from '@helpers/constants';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as VeBoostV21Deployment;
  const MAX_PRESEED = 10;

  const args = [
    input.VeBoostV2,
    input.VotingEscrow,
    input.PreseededBoostCalls.concat(
      new Array<(typeof input.PreseededBoostCalls)[number]>(MAX_PRESEED - input.PreseededBoostCalls.length).fill({
        from: ZERO_ADDRESS,
        to: ZERO_ADDRESS,
        end_time: 0,
      })
    ).map((call) => [call.from, call.to, call.end_time]), // Transform to tuple array
    input.PreseededApprovalCalls.concat(
      new Array<(typeof input.PreseededApprovalCalls)[number]>(MAX_PRESEED - input.PreseededApprovalCalls.length).fill({
        operator: ZERO_ADDRESS,
        delegator: ZERO_ADDRESS,
      })
    ).map((call) => [call.operator, call.delegator]), // Transform to tuple array
  ];

  await task.deploy('VeBoostV2', args, from, force);
};
