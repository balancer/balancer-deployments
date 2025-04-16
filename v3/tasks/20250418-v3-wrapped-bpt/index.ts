import { saveContractDeploymentTransactionHash, Task, TaskMode, TaskRunOptions } from '@src';
import { WrappedBPTDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as WrappedBPTDeployment;

  const factory = await task.deployAndVerify('WrappedBalancerPoolTokenFactory', [input.Vault], from, force);

  if (task.mode === TaskMode.LIVE) {
    // This mimics the logic inside task.deploy
    if (force || !task.output({ ensure: false })['MockWrappedBalancerPoolToken']) {
      const wrapperCreationReceipt = await (await factory.createWrappedToken(input.MockStablePool)).wait();
      const wrappedTokenAddress = await factory.getWrappedToken(input.MockStablePool);

      saveContractDeploymentTransactionHash(wrappedTokenAddress, wrapperCreationReceipt.transactionHash, task.network);
      task.save({ MockWrappedBalancerPoolToken: wrappedTokenAddress });
    }

    const mockWrappedBalancerPoolToken = await task.instanceAt(
      'WrappedBalancerPoolToken',
      task.output()['MockWrappedBalancerPoolToken']
    );

    // We are now ready to verify the wrapper
    await task.verify('WrappedBalancerPoolToken', mockWrappedBalancerPoolToken.address, [
      input.Vault,
      await mockWrappedBalancerPoolToken.balancerPoolToken(),
      await mockWrappedBalancerPoolToken.name(),
      await mockWrappedBalancerPoolToken.symbol(),
    ]);
  }
};
