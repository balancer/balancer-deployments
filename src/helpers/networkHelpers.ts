import type { SnapshotRestorer } from '@nomicfoundation/hardhat-network-helpers/types';
import { getHardhatConnection } from '../hardhatConnection';

async function getNetworkHelpers() {
  const connection = await getHardhatConnection();
  return connection.networkHelpers;
}

export async function takeSnapshot(): Promise<SnapshotRestorer> {
  return (await getNetworkHelpers()).takeSnapshot();
}

export async function impersonateAccount(address: string): Promise<void> {
  await (await getNetworkHelpers()).impersonateAccount(address);
}

export async function setBalance(address: string, balance: bigint): Promise<void> {
  await (await getNetworkHelpers()).setBalance(address, balance);
}

export async function setCode(address: string, bytecode: string): Promise<void> {
  await (await getNetworkHelpers()).setCode(address, bytecode);
}

export const time = {
  latest: async (): Promise<number> => (await getNetworkHelpers()).time.latest(),
  latestBlock: async (): Promise<number> => (await getNetworkHelpers()).time.latestBlock(),
  increase: async (amountInSeconds: bigint): Promise<number> => (await getNetworkHelpers()).time.increase(amountInSeconds),
  increaseTo: async (timestamp: bigint): Promise<void> => (await getNetworkHelpers()).time.increaseTo(timestamp),
  setNextBlockTimestamp: async (timestamp: bigint): Promise<void> =>
    (await getNetworkHelpers()).time.setNextBlockTimestamp(timestamp),
};
