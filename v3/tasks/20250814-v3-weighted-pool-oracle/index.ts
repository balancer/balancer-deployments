import { WeightedLPOracleDeployment } from './input';
import { saveContractDeploymentTransactionHash, Task, TaskMode, TaskRunOptions } from '@src';
import * as expectEvent from '@helpers/expectEvent';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as WeightedLPOracleDeployment;

  const factory = await task.deployAndVerify(
    'WeightedLPOracleFactory',
    [input.Vault, input.FactoryVersion, input.OracleVersion],
    from,
    force
  );

  if (task.mode === TaskMode.LIVE) {
    if (force || !task.output({ ensure: false })['MockWeightedLPOracle']) {
      const receipt = await (
        await factory.create(input.MockWeightedPool, [input.ConstantPriceFeed, input.ConstantPriceFeed])
      ).wait();
      const event = expectEvent.inReceipt(receipt, 'WeightedLPOracleCreated');
      const mockLPOracleAddress = event.args.oracle;

      saveContractDeploymentTransactionHash(mockLPOracleAddress, receipt.transactionHash, task.network);
      task.save({ MockWeightedLPOracle: mockLPOracleAddress });
    }

    const mockOracle = await task.instanceAt('WeightedLPOracle', task.output()['MockWeightedLPOracle']);

    // We are now ready to verify the oracle contract
    await task.verify('WeightedLPOracle', mockOracle.address, [
      input.Vault,
      input.MockWeightedPool,
      [input.ConstantPriceFeed, input.ConstantPriceFeed],
      input.OracleVersion,
    ]);
  }
};
