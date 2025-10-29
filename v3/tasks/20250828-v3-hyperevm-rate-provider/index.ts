import { HyperEVMRateProviderFactoryDeployment } from './input';
import { saveContractDeploymentTransactionHash, Task, TaskMode, TaskRunOptions } from '@src';
import * as expectEvent from '@helpers/expectEvent';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as HyperEVMRateProviderFactoryDeployment;

  const factory = await task.deployAndVerify(
    'HyperEVMRateProviderFactory',
    [input.Vault, input.FactoryVersion, input.RateProviderVersion],
    from,
    force
  );

  if (task.mode === TaskMode.LIVE) {
    if (force || !task.output({ ensure: false })['MockHyperEVMRateProvider']) {
      const receipt = await (await factory.create(input.ExampleTokenIndex, input.ExamplePairIndex)).wait();
      const event = expectEvent.inReceipt(receipt, 'RateProviderCreated');
      const mockRateProviderAddress = event.args.rateProvider;

      saveContractDeploymentTransactionHash(mockRateProviderAddress, receipt.transactionHash, task.network);
      task.save({ MockHyperEVMRateProvider: mockRateProviderAddress });
    }

    const mockRateProvider = await task.instanceAt('HyperEVMRateProvider', task.output()['MockHyperEVMRateProvider']);

    await task.verify('HyperEVMRateProvider', mockRateProvider.address, [
      input.ExampleTokenIndex,
      input.ExamplePairIndex,
    ]);
  }
};
