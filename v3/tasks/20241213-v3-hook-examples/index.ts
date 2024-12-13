import { HookExamplesDeployment } from './input';
import { Task, TaskRunOptions } from '@src';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as HookExamplesDeployment;

  const args = [input.Vault];
  await task.deployAndVerify('DirectionalFeeHookExample', [input.Vault, input.StablePoolFactory], from, force);
  await task.deployAndVerify('FeeTakingHookExample', args, from, force);
  await task.deployAndVerify('ExitFeeHookExample', args, from, force);
  await task.deployAndVerify('LotteryHookExample', [input.Vault, input.Router], from, force);
  await task.deployAndVerify(
    'NftLiquidityPositionExample',
    [input.Vault, input.WETH, input.Permit2, input.NftLiquidityPositionExampleVersion],
    from,
    force
  );
  await task.deployAndVerify(
    'VeBALFeeDiscountHookExample',
    [input.Vault, input.StablePoolFactory, input.VotingEscrow, input.Router],
    from,
    force
  );
};
