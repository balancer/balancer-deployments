import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';

import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import { WrappedBPTDeployment } from '../input';

describeForkTest('BPT-Wrapper', 'mainnet', 22275225, function () {
  let task: Task;
  let vault: Contract;
  let vaultExtension: Contract;
  let extensionEntrypoint: Contract;
  let bptFactory: Contract;
  let input: WrappedBPTDeployment;

  before('run task', async () => {
    task = new Task('20250418-v3-wrapped-bpt', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    bptFactory = await task.deployedInstance('WrappedBalancerPoolTokenFactory');
  });

  before('setup contracts', async () => {
    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
    vaultExtension = await vaultTask.deployedInstance('VaultExtension');
    extensionEntrypoint = vaultExtension.attach(vault.address);

    input = task.input() as WrappedBPTDeployment;
  });

  it('has Vault address', async () => {
    expect(await bptFactory.getVault()).eq(vault.address);
  });

  it('can wrap BPT', async () => {
    const BPT = input.MockStablePool;

    // Ensure it is registered.
    expect(await extensionEntrypoint.isPoolRegistered(BPT)).to.be.true;

    // Create a wrapped token.
    await bptFactory.createWrappedToken(BPT);

    const wrappedTokenAddress = await bptFactory.getWrappedToken(BPT);
    const wrappedToken = await task.instanceAt('WrappedBalancerPoolToken', wrappedTokenAddress);

    // Recover the original BPT from the wrapped token.
    expect(await wrappedToken.balancerPoolToken()).to.eq(BPT);
    expect(await wrappedToken.vault()).to.eq(vault.address);
  });
});
