import { ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';
import { fp } from '@helpers/numbers';
import * as expectEvent from '@helpers/expectEvent';

import { saveContractDeploymentTransactionHash } from '@src';
import { Task, TaskMode, TaskRunOptions } from '@src';
import { ReClammPoolDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as ReClammPoolDeployment;

  const args = [input.Vault, input.PauseWindowDuration, input.FactoryVersion, input.PoolVersion];
  const factory = await task.deployAndVerify('ReClammPoolFactory', args, from, force);

  // ReClamm parameters.
  const PRICE_SHIFT_DAILY_RATE = 100e16; // 100%
  const FOURTH_ROOT_PRICE_RATIO = fp(1.41421356); // Price Range of 4 (fourth root is 1.41)
  const CENTEREDNESS_MARGIN = 20e16; // 20%

  if (task.mode === TaskMode.LIVE) {
    const tokenConfig = [
      {
        token: input.WETH,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
      {
        token: input.BAL,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
    ].sort(function (a, b) {
      return a.token.toLowerCase().localeCompare(b.token.toLowerCase());
    });

    const newReClammPoolParams = {
      name: 'DO NOT USE - Mock ReClamm Pool',
      symbol: 'TEST',
      tokens: tokenConfig,
      roleAccounts: {
        pauseManager: ZERO_ADDRESS,
        swapFeeManager: ZERO_ADDRESS,
        poolCreator: ZERO_ADDRESS,
      },
      swapFeePercentage: fp(0.01),
      priceShiftDailyRate: PRICE_SHIFT_DAILY_RATE,
      fourthRootPriceRatio: FOURTH_ROOT_PRICE_RATIO,
      centerednessMargin: CENTEREDNESS_MARGIN,
      salt: ZERO_BYTES32,
    };

    // This mimics the logic inside task.deploy
    if (force || !task.output({ ensure: false })['MockReClammPool']) {
      const poolCreationReceipt = await (
        await factory.create(
          newReClammPoolParams.name,
          newReClammPoolParams.symbol,
          newReClammPoolParams.tokens,
          newReClammPoolParams.roleAccounts,
          newReClammPoolParams.swapFeePercentage,
          newReClammPoolParams.priceShiftDailyRate,
          newReClammPoolParams.fourthRootPriceRatio,
          newReClammPoolParams.centerednessMargin,
          newReClammPoolParams.salt
        )
      ).wait();
      const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
      const mockPoolAddress = event.args.pool;

      await saveContractDeploymentTransactionHash(mockPoolAddress, poolCreationReceipt.transactionHash, task.network);
      await task.save({ MockReClammPool: mockPoolAddress });
    }

    const mockPool = await task.instanceAt('ReClammPool', task.output()['MockReClammPool']);

    const poolParams = {
      name: newReClammPoolParams.name,
      symbol: newReClammPoolParams.symbol,
      version: await factory.getPoolVersion(),
      priceShiftDailyRate: newReClammPoolParams.priceShiftDailyRate,
      fourthRootPriceRatio: newReClammPoolParams.fourthRootPriceRatio,
      centerednessMargin: newReClammPoolParams.centerednessMargin,
    };

    // We are now ready to verify the Pool
    await task.verify('ReClammPool', mockPool.address, [poolParams, input.Vault]);
  }
};
