import * as expectEvent from '@helpers/expectEvent';
import hre, { ethers } from 'hardhat';
import { saveContractDeploymentTransactionHash } from '@src';
import { Task, TaskMode, TaskRunOptions } from '@src';
import { QuantAMMDeploymentInputParams, createPoolParams } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as QuantAMMDeploymentInputParams;

  const chainlinkEthOracleWrapper = await task.deployAndVerify(
    'ChainlinkOracle',
    [input.ChainlinkFeedETH],
    from,
    force
  );

  const chainlinkBtcOracleWrapper = await task.deployAndVerify(
    'ChainlinkOracle',
    [input.ChainlinkDataFeedBTC],
    from,
    force
  );

  await task.save({ ChainlinkBtcOracle: chainlinkBtcOracleWrapper });

  const chainlinkUsdcOracleWrapper = await task.deployAndVerify(
    'ChainlinkOracle',
    [input.ChainlinkDataFeedUSDC],
    from,
    force
  );
  await task.save({ ChainlinkUsdcOracle: chainlinkUsdcOracleWrapper });

  const accounts = await hre.ethers.getSigners();

  const updateWeightRunnerArgs = [accounts[0].address, chainlinkEthOracleWrapper.address];
  const updateWeightRunner = await task.deployAndVerify('UpdateWeightRunner', updateWeightRunnerArgs, from, force);
  await task.save({ UpdateWeightRunner: updateWeightRunner });

  const ruleArgs = [updateWeightRunner.address];

  const antiMomentumUpdateRule = await task.deployAndVerify('AntiMomentumUpdateRule', ruleArgs, from, force);

  await task.deployAndVerify('MomentumUpdateRule', ruleArgs, from, force);
  await task.deployAndVerify('PowerChannelUpdateRule', ruleArgs, from, force);
  await task.deployAndVerify('ChannelFollowingUpdateRule', ruleArgs, from, force);
  await task.deployAndVerify('DifferenceMomentumUpdateRule', ruleArgs, from, force);
  await task.deployAndVerify('MinimumVarianceUpdateRule', ruleArgs, from, force);

  const factoryArgs = [
    input.Vault,
    input.PauseWindowDuration,
    input.FactoryVersion,
    input.PoolVersion,
    updateWeightRunner.address,
  ];

  const factory = await task.deployAndVerify('QuantAMMWeightedPoolFactory', factoryArgs, from, force);

  if (task.mode === TaskMode.LIVE) {
    //rule is registered during pool creation, needs oracles to be valid
    await updateWeightRunner.addOracle(chainlinkEthOracleWrapper.address);
    await updateWeightRunner.addOracle(chainlinkBtcOracleWrapper.address);
    await updateWeightRunner.addOracle(chainlinkUsdcOracleWrapper.address);

    const salt = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(['address', 'uint256'], [accounts[0].address, Math.floor(Date.now() / 1000)])
    );

    const params = await createPoolParams(
      input.USDC,
      chainlinkUsdcOracleWrapper.address,
      input.WBTC,
      chainlinkBtcOracleWrapper.address,
      antiMomentumUpdateRule.address,
      accounts[0].address,
      salt
    );

    // This mimics the logic inside task.deploy
    if (force || !task.output({ ensure: false })['QuantAMMWeightedPool']) {
      const poolCreationReceipt = await (await factory.create(params)).wait();
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
