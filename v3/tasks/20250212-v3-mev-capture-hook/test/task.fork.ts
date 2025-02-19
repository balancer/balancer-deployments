import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import { bn } from '@helpers/numbers';

describeForkTest('MevCaptureHook', 'mainnet', 21882500, function () {
  let task: Task;
  let mevCaptureHook: Contract;

  before('run task', async () => {
    task = new Task('20250212-v3-mev-capture-hook', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    mevCaptureHook = await task.deployedInstance('MevCaptureHook');
  });

  it('gets fee taking hook flags', async () => {
    const flags = await mevCaptureHook.getHookFlags();
    expect(flags.enableHookAdjustedAmounts).to.be.equal(false);
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

  it('returns balancer registry', async () => {
    const registryTask = new Task('20250117-v3-contract-registry', TaskMode.READ_ONLY, getForkedNetwork(hre));
    const registry = await registryTask.deployedInstance('BalancerContractRegistry');
    expect(await mevCaptureHook.getBalancerContractRegistry()).to.be.eq(registry.address);
  });

  it('returns default mev tax multiplier', async () => {
    expect(await mevCaptureHook.getDefaultMevTaxMultiplier()).to.be.eq(bn('1500000000000000000000000'));
  });

  it('returns default mev tax threshold', async () => {
    expect(await mevCaptureHook.getDefaultMevTaxThreshold()).to.be.eq(bn('300000000'));
  });

  it('is enabled by default', async () => {
    expect(await mevCaptureHook.isMevTaxEnabled()).to.be.true;
  });
});
