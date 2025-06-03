import * as expectEvent from '@helpers/expectEvent';
import hre, { ethers } from 'hardhat';
import { saveContractDeploymentTransactionHash } from '@src';
import { Task, TaskMode, TaskRunOptions } from '@src';
import { QuantAMMDeploymentInputParams, createPoolParams } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as QuantAMMDeploymentInputParams;
  const accounts = await hre.ethers.getSigners();
  const accountAddress = accounts[0].address;

  const ruleArgs = [input.UpdateWeightRunner];

  console.log(ruleArgs);

  await task.deployAndVerify('MomentumUpdateRule', ruleArgs, from, force);
  await task.deployAndVerify('ChannelFollowingUpdateRule', ruleArgs, from, force);
  await task.deployAndVerify('DifferenceMomentumUpdateRule', ruleArgs, from, force);
  await task.deployAndVerify('MinimumVarianceUpdateRule', ruleArgs, from, force);

  const powerChannelRule = await task.deployAndVerify('PowerChannelUpdateRule', ruleArgs, from, force);

  const factoryArgs = [
    input.Vault,
    input.PauseWindowDuration,
    input.FactoryVersion,
    input.PoolVersion,
    input.UpdateWeightRunner,
  ];

  const factory = await task.deployAndVerify('QuantAMMWeightedPoolFactory', factoryArgs, from, force);

  if (task.mode === TaskMode.LIVE) {
    //rule is registered during pool creation, needs oracles to be valid

    const salt = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(['address', 'uint256'], [accountAddress, Math.floor(Date.now() / 1000)])
    );
    const params = await createPoolParams(
      input.scBTC,
      input.ChainlinkDataFeedBTC,
      input.SONIC,
      input.ChainlinkDataFeedSONIC,
      input.WETH,
      input.ChainlinkFeedETH,
      input.USDC,
      input.ChainlinkDataFeedUSDC,
      powerChannelRule.address,
      salt,
      accountAddress
    );

    if (force || !task.output({ ensure: false })['QuantAMMWeightedPool']) {
      const poolCreationReceipt = await (await factory.create(params)).wait();
      const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
      const safeHavenPoolAddress = event.args.pool;
      console.log('mockPoolAddress', safeHavenPoolAddress);
      console.log('poolCreationReceipt', poolCreationReceipt.transactionHash);

      await saveContractDeploymentTransactionHash(
        safeHavenPoolAddress,
        poolCreationReceipt.transactionHash,
        task.network
      );

      await task.save({ QuantAMMWeightedPool: safeHavenPoolAddress });
    }

    const poolParams = {
      name: params.name,
      symbol: params.symbol,
      numTokens: params.normalizedWeights.length,
      version: await factory.getPoolVersion(),
      updateWeightRunner: input.UpdateWeightRunner,
      poolRegistry: params.poolRegistry,
      poolDetails: params.poolDetails,
    };

    const safeHavenPool = await task.instanceAt('QuantAMMWeightedPool', task.output()['QuantAMMWeightedPool']);

    // We are now ready to verify the Pool
    await task.verify('QuantAMMWeightedPool', safeHavenPool.address, [poolParams, input.Vault]);
  }
};
