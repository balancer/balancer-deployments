import { ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';
import { fp } from '@helpers/numbers';
import * as expectEvent from '@helpers/expectEvent';

import { saveContractDeploymentTransactionHash } from '@src';
import { Task, TaskMode, TaskRunOptions } from '@src';
import { WeightedPoolDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as WeightedPoolDeployment;

  const args = [input.Vault, input.PauseWindowDuration, input.FactoryVersion, input.PoolVersion];
  const factory = await task.deployAndVerify('WeightedPoolFactory', args, from, force);

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

    const newWeightedPoolParams = {
      name: 'DO NOT USE - Mock Weighted Pool',
      symbol: 'TEST',
      tokens: tokenConfig,
      normalizedWeights: [fp(0.8), fp(0.2)],
      roleAccounts: {
        pauseManager: ZERO_ADDRESS,
        swapFeeManager: ZERO_ADDRESS,
        poolCreator: ZERO_ADDRESS,
      },
      swapFeePercentage: fp(0.01),
      hooksAddress: ZERO_ADDRESS,
      enableDonations: false,
      disableUnbalancedLiquidity: false,
      salt: ZERO_BYTES32,
    };

    // This mimics the logic inside task.deploy
    if (force || !task.output({ ensure: false })['MockWeightedPool']) {
      const poolCreationReceipt = await (
        await factory.create(
          newWeightedPoolParams.name,
          newWeightedPoolParams.symbol,
          newWeightedPoolParams.tokens,
          newWeightedPoolParams.normalizedWeights,
          newWeightedPoolParams.roleAccounts,
          newWeightedPoolParams.swapFeePercentage,
          newWeightedPoolParams.hooksAddress,
          newWeightedPoolParams.enableDonations,
          newWeightedPoolParams.disableUnbalancedLiquidity,
          newWeightedPoolParams.salt
        )
      ).wait();
      const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
      const mockPoolAddress = event.args.pool;

      await saveContractDeploymentTransactionHash(mockPoolAddress, poolCreationReceipt.transactionHash, task.network);
      await task.save({ MockWeightedPool: mockPoolAddress });
    }

    const mockPool = await task.instanceAt('WeightedPool', task.output()['MockWeightedPool']);

    const poolParams = {
      name: newWeightedPoolParams.name,
      symbol: newWeightedPoolParams.symbol,
      numTokens: newWeightedPoolParams.tokens.length,
      normalizedWeights: newWeightedPoolParams.normalizedWeights,
      version: await factory.getPoolVersion(),
    };

    // We are now ready to verify the Pool
    await task.verify('WeightedPool', mockPool.address, [poolParams, input.Vault]);
  }
};
