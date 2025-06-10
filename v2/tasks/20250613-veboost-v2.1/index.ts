import { Task, TaskRunOptions } from '@src';
import { VeBoostV21Deployment } from './input';
import { ZERO_ADDRESS } from '@helpers/constants';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as VeBoostV21Deployment;
  const MAX_PRESEED = 10;

    /*const args = [
    input.VotingEscrow,
    input.PreseededBoostCalls.concat(
      new Array<(typeof input.PreseededBoostCalls)[number]>(10 - input.PreseededBoostCalls.length).fill({
        from: ZERO_ADDRESS,
        to: ZERO_ADDRESS,
        amount: bn(0),
        start_time: 0,
        end_time: 0,
      })
    ),
    input.PreseededApprovalCalls.concat(
      new Array<(typeof input.PreseededApprovalCalls)[number]>(10 - input.PreseededApprovalCalls.length).fill({
        operator: ZERO_ADDRESS,
        delegator: ZERO_ADDRESS,
      })
    ),
  ];*/

  const preseededBoostCalls = [
    // Convert input objects to arrays
    ...input.PreseededBoostCalls.map((call) => [call.from, call.to, call.amount, call.start_time, call.end_time]),
    // Pad remaining slots with null arrays
    ...Array(MAX_PRESEED - input.PreseededBoostCalls.length)
      .fill(null)
      .map(() => [
        ZERO_ADDRESS, // from
        ZERO_ADDRESS, // to
        0, // amount
        0, // start_time
        0, // end_time
      ]),
  ];

  const preseededApprovalCalls = [
    // Convert input objects to arrays
    ...input.PreseededApprovalCalls.map((call) => [call.operator, call.delegator]),
    // Pad remaining slots with null arrays
    ...Array(MAX_PRESEED - input.PreseededApprovalCalls.length)
      .fill(null)
      .map(() => [
        ZERO_ADDRESS, // operator
        ZERO_ADDRESS, // delegator
      ]),
  ];

  const args = [input.VotingEscrow, preseededBoostCalls, preseededApprovalCalls];

  const useVyper = true;
  const noLibs = {};

  console.log(args);
  await task.deploy('VeBoostV2', args, from, force, noLibs, useVyper);
};
