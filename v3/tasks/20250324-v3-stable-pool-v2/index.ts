import { ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';
import { bn, fp } from '@helpers/numbers';
import * as expectEvent from '@helpers/expectEvent';

import { saveContractDeploymentTransactionHash } from '@src';
import { Task, TaskMode, TaskRunOptions } from '@src';
import { StablePoolDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as StablePoolDeployment;

  const args = [input.Vault, input.PauseWindowDuration, input.FactoryVersion, input.PoolVersion];
  const factory = await task.deployAndVerify('StablePoolFactory', args, from, force);

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

    const newStablePoolParams = {
      name: 'DO NOT USE - Mock Stable Pool',
      symbol: 'TEST',
      tokens: tokenConfig,
      amplificationParameter: bn(1000),
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
    if (force || !task.output({ ensure: false })['MockStablePool']) {
      const poolCreationReceipt = await (
        await factory.create(
          newStablePoolParams.name,
          newStablePoolParams.symbol,
          newStablePoolParams.tokens,
          newStablePoolParams.amplificationParameter,
          newStablePoolParams.roleAccounts,
          newStablePoolParams.swapFeePercentage,
          newStablePoolParams.hooksAddress,
          newStablePoolParams.enableDonations,
          newStablePoolParams.disableUnbalancedLiquidity,
          newStablePoolParams.salt
        )
      ).wait();
      const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
      const mockPoolAddress = event.args.pool;

      await saveContractDeploymentTransactionHash(mockPoolAddress, poolCreationReceipt.transactionHash, task.network);
      await task.save({ MockStablePool: mockPoolAddress });
    }

    const mockPool = await task.instanceAt('StablePool', task.output()['MockStablePool']);

    const poolParams = {
      name: newStablePoolParams.name,
      symbol: newStablePoolParams.symbol,
      amplificationParameter: newStablePoolParams.amplificationParameter,
      version: await factory.getPoolVersion(),
    };

    // We are now ready to verify the Pool
    await task.verify('StablePool', mockPool.address, [poolParams, input.Vault]);
  }
};
