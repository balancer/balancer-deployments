import { StableLPOracleDeployment } from './input';
import { saveContractDeploymentTransactionHash, Task, TaskMode, TaskRunOptions } from '@src';
import * as expectEvent from '@helpers/expectEvent';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as StableLPOracleDeployment;

  const factory = await task.deployAndVerify(
    'StableLPOracleFactory',
    [input.Vault, input.SequencerUptimeFeed, input.UptimeResyncWindow, input.FactoryVersion, input.OracleVersion],
    from,
    force
  );

  if (task.mode === TaskMode.LIVE) {
    if (force || !task.output({ ensure: false })['MockStableLPOracle']) {
      const receipt = await (
        await factory.create(
          input.MockStablePool,
          input.ShouldUseBlockTimeForOldestFeedUpdate,
          input.ShouldRevertIfVaultUnlocked,
          [input.ConstantPriceFeed, input.ConstantPriceFeed]
        )
      ).wait();

      const event = expectEvent.inReceipt(receipt, 'StableLPOracleCreated');
      const mockLPOracleAddress = event.args.oracle;

      saveContractDeploymentTransactionHash(mockLPOracleAddress, receipt.transactionHash, task.network);
      task.save({ MockStableLPOracle: mockLPOracleAddress });
    }

    const mockOracle = await task.instanceAt('StableLPOracle', task.output()['MockStableLPOracle']);

    // We are now ready to verify the oracle contract
    await task.verify('StableLPOracle', mockOracle.address, [
      input.Vault,
      input.MockStablePool,
      [input.ConstantPriceFeed, input.ConstantPriceFeed],
      input.SequencerUptimeFeed,
      input.UptimeResyncWindow,
      input.ShouldUseBlockTimeForOldestFeedUpdate,
      input.ShouldRevertIfVaultUnlocked,
      input.OracleVersion,
    ]);
  }
};
