import * as expectEvent from '@helpers/expectEvent';
import hre, { ethers } from 'hardhat';
import { saveContractDeploymentTransactionHash } from '@src';
import { Task, TaskMode, TaskRunOptions } from '@src';
import { QuantAMMDeploymentInputParams, createPoolParams } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  console.log('Running task 20250313-v3-quantamm');
  const input = task.input() as QuantAMMDeploymentInputParams;
  console.log('input gotten');
  console.log(input);
  const chainlinkEthOracleWrapper = await task.deployAndVerify(
    'ChainlinkOracle',
    [input.ChainlinkFeedETH],
    from,
    force
  );

  console.log('Deployed ChainlinkEthOracle');
  const chainlinkBtcOracleWrapper = await task.deployAndVerify(
    'ChainlinkOracle',
    [input.ChainlinkDataFeedBTC],
    from,
    force
  );
  await task.save({ ChainlinkBtcOracle: chainlinkBtcOracleWrapper });

  console.log('Deployed ChainlinkBtcOracle');
  const chainlinkUsdcOracleWrapper = await task.deployAndVerify(
    'ChainlinkOracle',
    [input.ChainlinkDataFeedUSDC],
    from,
    force
  );
  await task.save({ ChainlinkUsdcOracle: chainlinkUsdcOracleWrapper });

  console.log('Deployed ChainlinkUsdcOracle');
  const accounts = (await hre.ethers.getSigners()) as unknown as string[];

  console.log('accounts gotten');
  const updateWeightRunnerArgs = [accounts[0], chainlinkEthOracleWrapper.address];
  const updateWeightRunner = await task.deployAndVerify('UpdateWeightRunner', updateWeightRunnerArgs, from, force);
  await task.save({ UpdateWeightRunner: updateWeightRunner });

  console.log('Deployed UpdateWeightRunner');
  const ruleArgs = [updateWeightRunner.address];

  const antiMomentumUpdateRule = await task.deployAndVerify('AntimomentumUpdateRule', ruleArgs, from, force);
  await task.save({ AntimomentumUpdateRule: antiMomentumUpdateRule });

  console.log('Deployed AntimomentumUpdateRule');
  await task.deployAndVerify('MomentumUpdateRule', ruleArgs, from, force);
  console.log('Deployed MomentumUpdateRule');
  await task.deployAndVerify('PowerChannelUpdateRule', ruleArgs, from, force);
  console.log('Deployed PowerChannelUpdateRule');
  await task.deployAndVerify('ChannelFollowingUpdateRule', ruleArgs, from, force);
  console.log('Deployed ChannelFollowingUpdateRule');
  await task.deployAndVerify('DifferenceMomentumUpdateRule', ruleArgs, from, force);
  console.log('Deployed DifferenceMomentumUpdateRule');
  await task.deployAndVerify('MinimumVarianceUpdateRule', ruleArgs, from, force);
  console.log('Deployed MinimumVarianceUpdateRule');

  const factoryArgs = [
    input.Vault,
    input.PauseWindowDuration,
    input.FactoryVersion,
    input.PoolVersion,
    updateWeightRunner.address,
  ];

  const factory = await task.deployAndVerify('QuantAMMWeightedPoolFactory', factoryArgs, from, force);
  console.log('Deployed QuantAMMWeightedPoolFactory');
  if (task.mode === TaskMode.LIVE) {
    //rule is registered during pool creation, needs oracles to be valid
    await updateWeightRunner.addOracle(chainlinkEthOracleWrapper.address);
    await updateWeightRunner.addOracle(chainlinkBtcOracleWrapper.address);
    await updateWeightRunner.addOracle(chainlinkUsdcOracleWrapper.address);

    const salt = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(['address', 'uint256'], [accounts[0], Math.floor(Date.now() / 1000)])
    );

    const params = await createPoolParams(
      input.USDC,
      chainlinkUsdcOracleWrapper.address,
      input.WBTC,
      chainlinkBtcOracleWrapper.address,
      antiMomentumUpdateRule.address,
      accounts[0],
      salt
    );

    // This mimics the logic inside task.deploy
    if (force || !task.output({ ensure: false })['QuantAMMWeightedPool']) {
      console.log('Creating Pool');
      const poolCreationReceipt = await (await factory.create(params)).wait();
      console.log('Pool Created');
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
