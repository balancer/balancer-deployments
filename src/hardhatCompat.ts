import * as hardhatModule from 'hardhat';
import * as ethersModule from 'ethers';
import type { HardhatEthers } from '@nomicfoundation/hardhat-ethers/types';

import { applyEthersCompatibilityBridge, getCachedHardhatEthers } from './hardhatConnection';

export * from 'hardhat';
export default (hardhatModule as { default?: unknown }).default ?? hardhatModule;

const fallbackEthers = { ...ethersModule } as unknown as HardhatEthers;
applyEthersCompatibilityBridge(fallbackEthers);

function getEthersFromHre(): HardhatEthers | undefined {
  return getCachedHardhatEthers();
}

function throwUninitializedError(): never {
  throw new Error(
    'Hardhat ethers bridge is not initialized. Make sure describeForkTest() ran before accessing ethers in tests.'
  );
}

export const ethers: HardhatEthers = new Proxy({} as HardhatEthers, {
  get(_target, property, receiver) {
    const bridged = getEthersFromHre();
    if (bridged !== undefined) {
      return Reflect.get(bridged as unknown as object, property, receiver);
    }

    const fallbackValue = Reflect.get(fallbackEthers as unknown as object, property, receiver);
    if (fallbackValue === undefined) {
      throwUninitializedError();
    }
    return fallbackValue;
  },
}) as HardhatEthers;
