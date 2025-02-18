import { ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';
import { fp } from '@helpers/numbers';
import * as expectEvent from '@helpers/expectEvent';

import { saveContractDeploymentTransactionHash } from '@src';
import { Task, TaskMode, TaskRunOptions } from '@src';
import { Gyro2CLPPoolDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as Gyro2CLPPoolDeployment;

  const args = [input.Vault, input.PauseWindowDuration, input.FactoryVersion, input.PoolVersion, { gasLimit: 17e6 }];
  const factory = await task.deployAndVerify('Gyro2CLPPoolFactory', args, from, force);

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

    const newGyro2CLPPoolParams = {
      name: 'DO NOT USE - Mock Gyro Pool',
      symbol: 'TEST',
      tokens: tokenConfig,
      sqrtAlpha: fp(0.8),
      sqrtBeta: fp(1.1),
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
    if (force || !task.output({ ensure: false })['MockGyro2CLPPool']) {
      const poolCreationReceipt = await (
        await factory.create(
          newGyro2CLPPoolParams.name,
          newGyro2CLPPoolParams.symbol,
          newGyro2CLPPoolParams.tokens,
          newGyro2CLPPoolParams.sqrtAlpha,
          newGyro2CLPPoolParams.sqrtBeta,
          newGyro2CLPPoolParams.roleAccounts,
          newGyro2CLPPoolParams.swapFeePercentage,
          newGyro2CLPPoolParams.hooksAddress,
          newGyro2CLPPoolParams.enableDonations,
          newGyro2CLPPoolParams.disableUnbalancedLiquidity,
          newGyro2CLPPoolParams.salt
        )
      ).wait();
      const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
      const mockPoolAddress = event.args.pool;

      await saveContractDeploymentTransactionHash(mockPoolAddress, poolCreationReceipt.transactionHash, task.network);
      await task.save({ MockGyro2CLPPool: mockPoolAddress });
    }

    const mockPool = await task.instanceAt('Gyro2CLPPool', task.output()['MockGyro2CLPPool']);

    const poolParams = {
      name: newGyro2CLPPoolParams.name,
      symbol: newGyro2CLPPoolParams.symbol,
      numTokens: newGyro2CLPPoolParams.tokens.length,
      sqrtAlpha: newGyro2CLPPoolParams.sqrtAlpha,
      sqrtBeta: newGyro2CLPPoolParams.sqrtBeta,
      version: await factory.getPoolVersion(),
    };

    // We are now ready to verify the Pool
    await task.verify('Gyro2CLPPool', mockPool.address, [poolParams, input.Vault]);
  }
};
