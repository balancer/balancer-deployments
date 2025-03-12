
import * as expectEvent from '@helpers/expectEvent';

import { saveContractDeploymentTransactionHash } from '@src';
import { Task, TaskMode, TaskRunOptions } from '@src';
import { QuantAMMDeploymentInputParams, createPoolParams } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as QuantAMMDeploymentInputParams;

  const args = [input.Vault, input.PauseWindowDuration, input.FactoryVersion, input.PoolVersion];
  const chainlinkEthOracleWrapper = await task.deployAndVerify('ChainlinkOracle', args, from, force);
  const chainlinkBtcOracleWrapper = await task.deployAndVerify('ChainlinkOracle', args, from, force);
  const chainlinkUsdcOracleWrapper = await task.deployAndVerify('ChainlinkOracle', args, from, force);
  const updateWeightRunner = await task.deployAndVerify('UpdateWeightRunner', args, from, force);

  const antiMomentumUpdateRule = await task.deployAndVerify('AntimomentumUpdateRule', args, from, force);
  const momentumUpdateRule = await task.deployAndVerify('MomentumUpdateRule', args, from, force);
  const powerChannelUpdateRule = await task.deployAndVerify('PowerChannelUpdateRule', args, from, force);
  const channelFollowingUpdateRule = await task.deployAndVerify('ChannelFollowingUpdateRule', args, from, force);
  const differenceMomentumUpdateRule = await task.deployAndVerify('DifferenceMomentumUpdateRule', args, from, force);
  const minimumVarianceUpdateRule = await task.deployAndVerify('MinimumVarianceUpdateRule', args, from, force);
  
  const factory = await task.deployAndVerify('QuantAMMWeightedPoolFactory', args, from, force);

  if (task.mode === TaskMode.LIVE) {
    //rule is registered during pool creation, needs oracles to be valid
    await updateWeightRunner.addOracle(chainlinkEthOracleWrapper.address);
    await updateWeightRunner.addOracle(chainlinkBtcOracleWrapper.address);
    await updateWeightRunner.addOracle(chainlinkUsdcOracleWrapper.address);

    const params = await createPoolParams(
      input.USDC,
      chainlinkUsdcOracleWrapper.address,
      input.WBTC,
      chainlinkBtcOracleWrapper.address,
      antiMomentumUpdateRule.address
    );

    // This mimics the logic inside task.deploy
    if (force || !task.output({ ensure: false })['QuantAMMWeightedPool']) {
      const poolCreationReceipt = await (
        await factory.create(
          params
        )
      ).wait();
      const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
      const mockPoolAddress = event.args.pool;

      await saveContractDeploymentTransactionHash(mockPoolAddress, poolCreationReceipt.transactionHash, task.network);
      await task.save({ MockQuantAMMWeightedPool: mockPoolAddress });
    }

    const mockPool = await task.instanceAt('QuantAMMWeightedPool', task.output()['MockQuantAMMWeightedPool']);

    const poolParams = {
      name: params.name,
      symbol: params.symbol,
      numTokens: params.normalizedWeights.length,
      version: await factory.getPoolVersion(),
      updateWeightRunner: updateWeightRunner.address,
      poolRegistry: params.poolRegistry,
      poolDetails: params.poolDetails,
    };

    // We are now ready to verify the Pool
    await task.verify('QuantAMMWeightedPool', mockPool.address, [poolParams, input.Vault]);
  }
};

