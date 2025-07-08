import { DELEGATE_OWNER, ZERO_BYTES32 } from '@helpers/constants';
import { LBPoolFactoryDeployment } from './input';
import { saveContractDeploymentTransactionHash, Task, TaskMode, TaskRunOptions } from '@src';
import { DAY, HOUR } from '@helpers/time';
import { bn, fp } from '@helpers/numbers';
import * as expectEvent from '@helpers/expectEvent';
import { ethers } from 'hardhat';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as LBPoolFactoryDeployment;

  const migrationRouterArgs = [input.BalancerContractRegistry, input.LBPMigrationRouterVersion];
  const migrationRouter = await task.deployAndVerify('LBPMigrationRouter', migrationRouterArgs, from, force);
  const factoryArgs = [
    input.Vault,
    input.PauseWindowDuration,
    input.FactoryVersion,
    input.PoolVersion,
    input.Router,
    migrationRouter.address,
  ];
  const factory = await task.deployAndVerify('LBPoolFactory', factoryArgs, from, force);

  if (task.mode === TaskMode.LIVE) {
    const HIGH_WEIGHT = fp(0.8);
    const LOW_WEIGHT = fp(0.2);

    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const timestampBefore = bn(blockBefore.timestamp);

    const newLBPParams = {
      owner: from ?? DELEGATE_OWNER,
      projectToken: input.TestBalancerToken,
      reserveToken: input.WETH,
      projectTokenStartWeight: HIGH_WEIGHT,
      reserveTokenStartWeight: LOW_WEIGHT,
      projectTokenEndWeight: LOW_WEIGHT,
      reserveTokenEndWeight: HIGH_WEIGHT,
      startTime: timestampBefore.add(HOUR),
      endTime: timestampBefore.add(DAY),
      blockProjectTokenSwapsIn: false,
    };

    const poolCreationParams = {
      name: 'DO NOT USE - Mock LBP',
      symbol: 'TEST',
      newLBPParams,
      swapFeePercentage: fp(0.01),
      salt: ZERO_BYTES32,
    };

    // This mimics the logic inside task.deploy
    if (force || !task.output({ ensure: false })['MockLBPool']) {
      const poolCreationReceipt = await (
        await factory.create(
          poolCreationParams.name,
          poolCreationParams.symbol,
          poolCreationParams.newLBPParams,
          poolCreationParams.swapFeePercentage,
          poolCreationParams.salt
        )
      ).wait();

      const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
      const mockPoolAddress = event.args.pool;

      saveContractDeploymentTransactionHash(mockPoolAddress, poolCreationReceipt.transactionHash, task.network);
      task.save({ MockLBPool: mockPoolAddress });
    }

    const mockPool = await task.instanceAt('LBPool', task.output()['MockLBPool']);

    // Get actual params (verify might be executed after the initial deployment, so timestamps gotten by the script
    // itself might be outdated).
    const updateParams = await mockPool.getGradualWeightUpdateParams();
    newLBPParams.startTime = updateParams.startTime;
    newLBPParams.endTime = updateParams.endTime;

    const poolParams = [
      poolCreationParams.name,
      poolCreationParams.symbol,
      poolCreationParams.newLBPParams,
      input.Vault,
      input.Router,
      await factory.getPoolVersion(),
    ];

    // We are now ready to verify the Pool
    await task.verify('LBPool', mockPool.address, poolParams);
  }
};
