import hre from 'hardhat';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import { expect } from 'chai';

describeForkTest('V3-HyperEVMRateProviderFactory', 'hyperevm', 12336700, function () {
  let task: Task;
  let vault: Contract, factory: Contract;

  const FACTORY_NAME = 'HyperEVMRateProviderFactory';
  const VERSION_NUMBER = 2;

  before('run task', async () => {
    task = new Task('20250828-v3-hyperevm-rate-provider', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    factory = await task.deployedInstance(FACTORY_NAME);
  });

  before('setup contracts', async () => {
    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
  });

  it('checks vault', async () => {
    const factoryVault = await factory.getVault();
    expect(factoryVault).to.be.eq(vault.address);
  });

  it('checks version', async () => {
    const factoryVersion = JSON.parse(await factory.version());
    expect(factoryVersion.deployment).to.be.eq(task.id);
    expect(factoryVersion.name).to.be.eq(FACTORY_NAME);
    expect(factoryVersion.version).to.be.eq(VERSION_NUMBER);
  });

  it('checks rate provider version', async () => {
    const rateProviderVersion = await factory.getRateProviderVersion();
    expect(rateProviderVersion).to.be.eq(VERSION_NUMBER);
  });

  // We need the precompile to create a rate provider, so we skip this test.
  // We could deploy a precompile mock; but we've done that already in forge so it doesn't add any value.
});
