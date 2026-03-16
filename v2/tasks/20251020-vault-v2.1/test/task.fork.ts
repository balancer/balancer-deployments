import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import { VaultDeployment } from '../input';
import { currentTimestamp } from '@helpers/time';

describeForkTest.skip('Vault v2.1', 'plasma', 3100000, function () {
  const TASK_NAME = '20251020-vault-v2.1';
  const CONTRACT_NAME = 'Vault';

  let task: Task;
  let vault: Contract;
  let input: VaultDeployment;

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    vault = await task.deployedInstance(CONTRACT_NAME);
  });

  it('Vault has valid configuration', async () => {
    input = task.input() as VaultDeployment;
    expect(await vault.getAuthorizer()).to.eq(input.Authorizer);
    expect(await vault.WETH()).to.eq(input.WETH);
  });

  it('Vault is not paused', async () => {
    const pausedState = await vault.getPausedState();
    const currentTime = await currentTimestamp();

    expect(pausedState.paused).to.be.false;
    expect(pausedState.pauseWindowEndTime).to.almostEqual(currentTime.add(input.pauseWindowDuration));
  });
});
