import { EclpLPOracleDeployment } from './input';
import { saveContractDeploymentTransactionHash, Task, TaskMode, TaskRunOptions } from '@src';
import * as expectEvent from '@helpers/expectEvent';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as EclpLPOracleDeployment;

  const factory = await task.deployAndVerify(
    'EclpLPOracleFactory',
    [input.Vault, input.SequencerUptimeFeed, input.UptimeResyncWindow, input.FactoryVersion, input.OracleVersion],
    from,
    force
  );

  if (task.mode === TaskMode.LIVE) {
    if (force || !task.output({ ensure: false })['MockEclpLPOracle']) {
      const receipt = await (
        await factory.create(
          input.MockGyroECLPPool,
          input.ShouldUseBlockTimeForOldestFeedUpdate,
          input.ShouldRevertIfVaultUnlocked,
          [input.ConstantPriceFeed, input.ConstantPriceFeed]
        )
      ).wait();

      const event = expectEvent.inReceipt(receipt, 'EclpLPOracleCreated');
      const mockLPOracleAddress = event.args.oracle;

      saveContractDeploymentTransactionHash(mockLPOracleAddress, receipt.transactionHash, task.network);
      task.save({ MockEclpLPOracle: mockLPOracleAddress });
    }

    const mockOracle = await task.instanceAt('EclpLPOracle', task.output()['MockEclpLPOracle']);

    // We are now ready to verify the oracle contract
    await task.verify('EclpLPOracle', mockOracle.address, [
      input.Vault,
      input.MockGyroECLPPool,
      [input.ConstantPriceFeed, input.ConstantPriceFeed],
      input.SequencerUptimeFeed,
      input.UptimeResyncWindow,
      input.ShouldUseBlockTimeForOldestFeedUpdate,
      input.ShouldRevertIfVaultUnlocked,
      input.OracleVersion,
    ]);
  }
};
