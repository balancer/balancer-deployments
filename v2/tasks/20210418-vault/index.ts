import { VaultDeployment } from './input';
import { Task, TaskMode, TaskRunOptions } from '@src';

const skipCheckNetworkList = ['plasma'];

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  if (task.mode === TaskMode.CHECK && skipCheckNetworkList.includes(task.network)) {
    // Vault was deployed in another task; skip check.
    return;
  }

  const input = task.input() as VaultDeployment;
  const vaultArgs = [input.Authorizer, input.WETH, input.pauseWindowDuration, input.bufferPeriodDuration];
  const vault = await task.deployAndVerify('Vault', vaultArgs, from, force);

  // The vault automatically also deploys the protocol fees collector: we must verify it
  const feeCollector = await vault.getProtocolFeesCollector();
  const feeCollectorArgs = [vault.address]; // See ProtocolFeesCollector constructor
  await task.verify('ProtocolFeesCollector', feeCollector, feeCollectorArgs);
  await task.save({ ProtocolFeesCollector: feeCollector });

  const helpersArgs = [vault.address];
  await task.deployAndVerify('BalancerHelpers', helpersArgs, from, force);
};
