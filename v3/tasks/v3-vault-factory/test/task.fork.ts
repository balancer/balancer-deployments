import hre from 'hardhat';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';

describeForkTest('VaultFactory-V3', 'sepolia', 7151500, function () {
  let task: Task;
  let vault: Contract, vaultExtension: Contract, vaultAdmin: Contract, protocolFeeController: Contract;

  before('run task', async () => {
    task = new Task('v3-vault-factory', TaskMode.TEST, getForkedNetwork(hre));
    const signers = await ethers.getSigners();
    const from = signers[4];
    await task.run({ force: true, from });

    vault = await task.deployedInstance('Vault');
    vaultExtension = await task.deployedInstance('VaultExtension');
    vaultAdmin = await task.deployedInstance('VaultAdmin');
    protocolFeeController = await task.deployedInstance('ProtocolFeeController');
  });

  it('checks admin reference', async () => {
    expect(await vaultAdmin.vault()).to.be.equal(vault.address);
  });

  it('checks extension reference', async () => {
    expect(await vaultExtension.vault()).to.be.equal(vault.address);
  });

  it('checks protocol fee controller reference', async () => {
    const vaultExtensionAsVault = vaultExtension.attach(vault.address);
    expect(await vaultExtensionAsVault.getProtocolFeeController()).to.be.equal(protocolFeeController.address);
  });

  it('checks min trade amount', async () => {
    const vaultAdminAsVault = vaultAdmin.attach(vault.address);
    expect(await vaultAdminAsVault.getMinimumTradeAmount()).to.be.equal(1e6);
  });

  it('checks min wrap amount', async () => {
    const vaultAdminAsVault = vaultAdmin.attach(vault.address);
    expect(await vaultAdminAsVault.getMinimumWrapAmount()).to.be.equal(1e3);
  });
});
