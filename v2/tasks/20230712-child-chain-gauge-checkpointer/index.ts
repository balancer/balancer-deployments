import { Task, TaskRunOptions } from '@src';
import { BatchRelayerDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as BatchRelayerDeployment;

  const relayerLibraryArgs = [
    input.Vault,
    input.wstETH,
    input.BalancerMinter,
    input.CanCallUserCheckpoint,
    input.Version,
  ];
  const relayerLibrary = await task.deployAndVerify('BatchRelayerLibrary', relayerLibraryArgs, from, force);

  // The relayer library automatically also deploys the relayer itself: we must verify it
  const relayer: string = await relayerLibrary.getEntrypoint();

  const relayerArgs = [input.Vault, relayerLibrary.address, input.Version]; // See BalancerRelayer's constructor
  await task.verify('BalancerRelayer', relayer, relayerArgs);
  await task.save({ BalancerRelayer: relayer });
};
