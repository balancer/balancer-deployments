import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/types';

import { fp } from './helpers/numbers';
import { impersonateAccount, setBalance as setAccountBalance } from './helpers/networkHelpers';

export async function getSigners(): Promise<HardhatEthersSigner[]> {
  const { ethers } = await import('@src/hardhatCompat');
  return ethers.getSigners();
}

export async function getSigner(index = 0): Promise<HardhatEthersSigner> {
  return (await getSigners())[index];
}

export async function impersonate(address: string, balance = fp(100)): Promise<HardhatEthersSigner> {
  await impersonateAccount(address);
  await setBalance(address, balance);

  const { ethers } = await import('@src/hardhatCompat');
  return ethers.getSigner(address);
}

export async function setBalance(address: string, balance: bigint): Promise<void> {
  await setAccountBalance(address, balance);
}
