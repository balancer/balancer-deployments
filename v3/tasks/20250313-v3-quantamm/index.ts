
import * as expectEvent from '@helpers/expectEvent';
import hre from 'hardhat';
import { saveContractDeploymentTransactionHash } from '@src';
import { Task, TaskMode, TaskRunOptions } from '@src';
import { QuantAMMDeploymentInputParams, createPoolParams } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as QuantAMMDeploymentInputParams;

  const chainlinkEthOracleWrapper = await task.deployAndVerify('ChainlinkOracle', [input.ChainlinkSepoliaDataFeedETH], from, force);
  const chainlinkBtcOracleWrapper = await task.deployAndVerify('ChainlinkOracle', [input.ChainlinkSepoliaDataFeedBTC], from, force);
  const chainlinkUsdcOracleWrapper = await task.deployAndVerify('ChainlinkOracle', [input.ChainlinkSepoliaDataFeedUSDC], from, force);
  
  const accounts = await hre.ethers.getSigners() as string[];
  
  const updateWeightRunnerArgs = [accounts[0], chainlinkEthOracleWrapper.address]
  const updateWeightRunner = await task.deployAndVerify('UpdateWeightRunner', updateWeightRunnerArgs, from, force);

  const ruleArgs = [updateWeightRunner.address];

  const antiMomentumUpdateRule = await task.deployAndVerify('AntimomentumUpdateRule', ruleArgs, from, force);
  const momentumUpdateRule = await task.deployAndVerify('MomentumUpdateRule', ruleArgs, from, force);
  const powerChannelUpdateRule = await task.deployAndVerify('PowerChannelUpdateRule', ruleArgs, from, force);
  const channelFollowingUpdateRule = await task.deployAndVerify('ChannelFollowingUpdateRule', ruleArgs, from, force);
  const differenceMomentumUpdateRule = await task.deployAndVerify('DifferenceMomentumUpdateRule', ruleArgs, from, force);
  const minimumVarianceUpdateRule = await task.deployAndVerify('MinimumVarianceUpdateRule', ruleArgs, from, force);

  const factoryArgs = [input.Vault, input.PauseWindowDuration, input.FactoryVersion, input.PoolVersion, updateWeightRunner.address];

  const factory = await task.deployAndVerify('QuantAMMWeightedPoolFactory', factoryArgs, from, force);

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

