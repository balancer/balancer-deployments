import hre from 'hardhat';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import { MONTH, fromNow } from '@helpers/time';

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
    const vaultAsExtension = vaultExtension.attach(vault.address);
    expect(await vaultAsExtension.getProtocolFeeController()).to.be.equal(protocolFeeController.address);
  });

  it('checks vaultAdmin constants', async () => {
    expect(await vaultAdmin.getMinimumTradeAmount()).to.be.equal(1e6);
    expect(await vaultAdmin.getMinimumWrapAmount()).to.be.equal(1e4);
    expect(await vaultAdmin.getMinimumPoolTokens()).to.be.equal(2);
    expect(await vaultAdmin.getMaximumPoolTokens()).to.be.equal(8);
    expect(await vaultAdmin.getMaximumPoolTokens()).to.be.equal(8);
    expect(await vaultAdmin.getPauseWindowEndTime()).to.be.equal(await fromNow(MONTH * 12 * 4));
    expect(await vaultAdmin.getBufferPeriodDuration()).to.be.equal(MONTH * 3);
    expect(await vaultAdmin.getBufferPeriodEndTime()).to.be.equal(await fromNow(MONTH * 12 * 4 + MONTH * 3));
  });

  it('checks extension', async () => {
    expect(await vault.getVaultExtension()).to.be.eq(vaultExtension.address);
  });

  it('checks admin', async () => {
    expect(await vaultExtension.getVaultAdmin()).to.be.eq(vaultAdmin.address);
  });
});
