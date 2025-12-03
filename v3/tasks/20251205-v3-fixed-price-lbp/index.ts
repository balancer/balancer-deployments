import { DELEGATE_OWNER, ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';
import { FixedPriceLBPoolFactoryDeployment } from './input';
import { saveContractDeploymentTransactionHash, Task, TaskMode, TaskRunOptions } from '@src';
import { DAY, HOUR } from '@helpers/time';
import { bn, fp } from '@helpers/numbers';
import * as expectEvent from '@helpers/expectEvent';
import { ethers } from 'hardhat';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as FixedPriceLBPoolFactoryDeployment;

  const factoryArgs = [input.Vault, input.PauseWindowDuration, input.FactoryVersion, input.PoolVersion, input.Router];
  const factory = await task.deployAndVerify('FixedPriceLBPoolFactory', factoryArgs, from, force);

  if (task.mode === TaskMode.LIVE) {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const timestampBefore = bn(blockBefore.timestamp);

    const newFixedLBPParams = {
      name: 'DO NOT USE - Mock Fixed Price LBP',
      symbol: 'TEST',
      owner: from ?? DELEGATE_OWNER,
      projectToken: input.TestBalancerToken,
      reserveToken: input.WETH,
      startTime: timestampBefore.add(HOUR),
      endTime: timestampBefore.add(DAY),
      blockProjectTokenSwapsIn: true,
    };

    const projectTokenRate = fp(1);

    // This mimics the logic inside task.deploy
    if (force || !task.output({ ensure: false })['MockFixedPriceLBPool']) {
      const poolCreationReceipt = await (
        await factory.create(
          newFixedLBPParams,
          projectTokenRate,
          fp(0.01), // swap fee
          ZERO_BYTES32, // salt
          ZERO_ADDRESS // pool creator
        )
      ).wait();

      const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
      const mockPoolAddress = event.args.pool;

      saveContractDeploymentTransactionHash(mockPoolAddress, poolCreationReceipt.transactionHash, task.network);
      task.save({ MockFixedPriceLBPool: mockPoolAddress });
    }

    const mockPool = await task.instanceAt('FixedPriceLBPool', task.output()['MockFixedPriceLBPool']);

    // Get actual params (verify might be executed after the initial deployment, so timestamps gotten by the script
    // itself might be outdated).
    const updateParams = await mockPool.getGradualWeightUpdateParams();
    newFixedLBPParams.startTime = updateParams.startTime;
    newFixedLBPParams.endTime = updateParams.endTime;

    const factoryParams = {
      vault: input.Vault,
      trustedRouter: input.Router,
      poolVersion: await factory.getPoolVersion(),
    };

    const poolParams = [newFixedLBPParams, factoryParams, projectTokenRate];

    // We are now ready to verify the Pool
    await task.verify('FixedPriceLBPool', mockPool.address, poolParams);
  }
};
