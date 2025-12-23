import { DELEGATE_OWNER, ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';
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

    const newLBPCommonParams = {
      name: 'DO NOT USE - Mock LBP',
      symbol: 'TEST',
      owner: from ?? DELEGATE_OWNER,
      projectToken: input.TestBalancerToken,
      reserveToken: input.WETH,
      startTime: timestampBefore.add(HOUR),
      endTime: timestampBefore.add(DAY),
      blockProjectTokenSwapsIn: false,
    };

    const newLBPParams = {
      projectTokenStartWeight: HIGH_WEIGHT,
      reserveTokenStartWeight: LOW_WEIGHT,
      projectTokenEndWeight: LOW_WEIGHT,
      reserveTokenEndWeight: HIGH_WEIGHT,
      reserveTokenVirtualBalance: fp(1000),
    };

    const swapFeePercentage = fp(0.01);
    const poolCreator = ZERO_ADDRESS;

    // This mimics the logic inside task.deploy
    if (force || !task.output({ ensure: false })['MockLBPool']) {
      const poolCreationReceipt = await (
        await factory.create(
          newLBPCommonParams,
          newLBPParams,
          swapFeePercentage,
          ZERO_BYTES32, // Salt
          poolCreator
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
    newLBPCommonParams.startTime = updateParams.startTime;
    newLBPCommonParams.endTime = updateParams.endTime;

    const migrationParams = {
      migrationRouter: ZERO_ADDRESS,
      lockDurationAfterMigration: 0,
      bptPercentageToMigrate: 0,
      migrationWeightProjectToken: 0,
      migrationWeightReserveToken: 0,
    };

    const factoryParams = {
      vault: input.Vault,
      trustedRouter: input.Router,
      poolVersion: await factory.getPoolVersion(),
    };

    const poolParams = [newLBPCommonParams, migrationParams, newLBPParams, factoryParams];

    // We are now ready to verify the Pool
    await task.verify('LBPool', mockPool.address, poolParams);
  }
};
