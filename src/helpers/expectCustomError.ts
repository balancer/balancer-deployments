import { ethers } from 'hardhat';
import { expect } from 'chai';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function expectRevertWithCustomError(promise: Promise<any>, errorDefinition: string): Promise<void> {
  const expectedSelector = ethers.utils.id(errorDefinition).slice(0, 10);

  let reverted = false;
  try {
    await promise;
  } catch (e: unknown) {
    reverted = true;
    const errorMessage = e instanceof Error ? e.message : String(e);

    expect(errorMessage).to.include(expectedSelector);
  }
  expect(reverted).to.be.true;
}
