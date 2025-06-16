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
  const DAILY_PRICE_SHIFT_EXPONENT = fp(1); // 100%
  const CENTEREDNESS_MARGIN = fp(0.2); // 20%
  const INITIAL_MIN_PRICE = fp(1000);
  const INITIAL_MAX_PRICE = fp(4000);
  const INITIAL_TARGET_PRICE = fp(2500);

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
      dailyPriceShiftExponent: DAILY_PRICE_SHIFT_EXPONENT,
      initialMinPrice: INITIAL_MIN_PRICE,
      initialMaxPrice: INITIAL_MAX_PRICE,
      initialTargetPrice: INITIAL_TARGET_PRICE,
      centerednessMargin: CENTEREDNESS_MARGIN,
      salt: ZERO_BYTES32,
    };

    // This mimics the logic inside task.deploy
    if (force || !task.output({ ensure: false })['MockReClammPool']) {
      const priceParams = {
        initialMinPrice: newReClammPoolParams.initialMinPrice,
        initialMaxPrice: newReClammPoolParams.initialMaxPrice,
        initialTargetPrice: newReClammPoolParams.initialTargetPrice,
        tokenAPriceIncludesRate: false,
        tokenBPriceIncludesRate: false,
      };

      const poolCreationReceipt = await (
        await factory.create(
          newReClammPoolParams.name,
          newReClammPoolParams.symbol,
          newReClammPoolParams.tokens,
          newReClammPoolParams.roleAccounts,
          newReClammPoolParams.swapFeePercentage,
          priceParams,
          newReClammPoolParams.dailyPriceShiftExponent,
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
      dailyPriceShiftExponent: newReClammPoolParams.dailyPriceShiftExponent,
      centerednessMargin: newReClammPoolParams.centerednessMargin,
      initialMinPrice: newReClammPoolParams.initialMinPrice,
      initialMaxPrice: newReClammPoolParams.initialMaxPrice,
      initialTargetPrice: newReClammPoolParams.initialTargetPrice,
    };

    // We are now ready to verify the Pool
    await task.verify('ReClammPool', mockPool.address, [poolParams, input.Vault]);
  }
};
