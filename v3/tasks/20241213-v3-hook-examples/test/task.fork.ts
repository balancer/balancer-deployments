import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';

describeForkTest('HookExamples', 'sepolia', 7272000, function () {
  let task: Task;
  let feeTakingHook: Contract, exitFeeHook: Contract;
  before('run task', async () => {
    task = new Task('20241213-v3-hook-examples', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    feeTakingHook = await task.deployedInstance('FeeTakingHookExample');
    exitFeeHook = await task.deployedInstance('ExitFeeHookExample');
  });

  it('gets fee taking hook flags', async () => {
    const flags = await feeTakingHook.getHookFlags();
    expect(flags.enableHookAdjustedAmounts).to.be.equal(true);
    expect(flags.enableHookAdjustedAmounts).to.be.equal(true);
    expect(flags.shouldCallBeforeInitialize).to.be.equal(false);
    expect(flags.shouldCallAfterInitialize).to.be.equal(false);
    expect(flags.shouldCallComputeDynamicSwapFee).to.be.equal(false);
    expect(flags.shouldCallBeforeSwap).to.be.equal(false);
    expect(flags.shouldCallAfterSwap).to.be.equal(true);
    expect(flags.shouldCallBeforeAddLiquidity).to.be.equal(false);
    expect(flags.shouldCallAfterAddLiquidity).to.be.equal(true);
    expect(flags.shouldCallBeforeRemoveLiquidity).to.be.equal(false);
    expect(flags.shouldCallAfterRemoveLiquidity).to.be.equal(true);
  });

  it('gets exit fee hook flags', async () => {
    const flags = await exitFeeHook.getHookFlags();
    expect(flags.enableHookAdjustedAmounts).to.be.equal(true);
    expect(flags.enableHookAdjustedAmounts).to.be.equal(true);
    expect(flags.shouldCallBeforeInitialize).to.be.equal(false);
    expect(flags.shouldCallAfterInitialize).to.be.equal(false);
    expect(flags.shouldCallComputeDynamicSwapFee).to.be.equal(false);
    expect(flags.shouldCallBeforeSwap).to.be.equal(false);
    expect(flags.shouldCallAfterSwap).to.be.equal(false);
    expect(flags.shouldCallBeforeAddLiquidity).to.be.equal(false);
    expect(flags.shouldCallAfterAddLiquidity).to.be.equal(false);
    expect(flags.shouldCallBeforeRemoveLiquidity).to.be.equal(false);
    expect(flags.shouldCallAfterRemoveLiquidity).to.be.equal(true);
  });
});
