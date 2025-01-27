import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';

describeForkTest('MevTaxHook', 'mainnet', 21697000, function () {
  let task: Task;
  let mevTaxHook: Contract;
  before('run task', async () => {
    task = new Task('20240125-v3-mev-tax-hook', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    mevTaxHook = await task.deployedInstance('MevTaxHook');
  });

  it('gets fee taking hook flags', async () => {
    const flags = await mevTaxHook.getHookFlags();
    expect(flags.enableHookAdjustedAmounts).to.be.equal(true);
    expect(flags.shouldCallBeforeInitialize).to.be.equal(false);
    expect(flags.shouldCallAfterInitialize).to.be.equal(false);
    expect(flags.shouldCallComputeDynamicSwapFee).to.be.equal(true);
    expect(flags.shouldCallBeforeSwap).to.be.equal(false);
    expect(flags.shouldCallAfterSwap).to.be.equal(false);
    expect(flags.shouldCallBeforeAddLiquidity).to.be.equal(true);
    expect(flags.shouldCallAfterAddLiquidity).to.be.equal(false);
    expect(flags.shouldCallBeforeRemoveLiquidity).to.be.equal(true);
    expect(flags.shouldCallAfterRemoveLiquidity).to.be.equal(false);
  });
});
