import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import { fp } from '@helpers/numbers';

describeForkTest('StableSurgeHookV2', 'mainnet', 22189600, function () {
  let task: Task;
  let hook: Contract;

  const TASK_NAME = '20250403-v3-stable-surge-hook-v2';
  const HOOK_CONTRACT_NAME = 'StableSurgeHook';
  const CONTRACT_VERSION_NUMBER = 2;

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    hook = await task.deployedInstance(HOOK_CONTRACT_NAME);
  });

  it('checks default max threshold percentage', async () => {
    expect(await hook.getDefaultMaxSurgeFeePercentage()).to.be.eq(fp(0.95));
  });

  it('checks default surge threshold percentage', async () => {
    expect(await hook.getDefaultSurgeThresholdPercentage()).to.be.eq(fp(0.3));
  });

  it('checks hook version', async () => {
    const version = JSON.parse(await hook.version());
    expect(version.deployment).to.be.eq(TASK_NAME);
    expect(version.version).to.be.eq(CONTRACT_VERSION_NUMBER);
    expect(version.name).to.be.eq(HOOK_CONTRACT_NAME);
  });
});
