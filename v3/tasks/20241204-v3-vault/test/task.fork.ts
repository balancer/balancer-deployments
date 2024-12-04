import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, impersonate, Task, TaskMode } from '@src';
import { MONTH, fromNow } from '@helpers/time';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { fp } from '@helpers/numbers';

describeForkTest('VaultFactory-V3', 'mainnet', 21331800, function () {
  let task: Task;
  let vault: Contract, vaultExtension: Contract, vaultAdmin: Contract, protocolFeeController: Contract;
  let deployer: SignerWithAddress;

  const deployerAddress = '0x3877188e9e5DA25B11fDb7F5E8D4fDDDCE2d2270';
  const expectedAddress = '0xbA1333333333a1BA1108E8412f11850A5C319bA9';

  before('run task', async () => {
    task = new Task('20241204-v3-vault', TaskMode.TEST, getForkedNetwork(hre));
    deployer = await impersonate(deployerAddress, fp(100));
    await task.run({ force: true, from: deployer });

    vault = await task.deployedInstance('Vault');
    vaultExtension = await task.deployedInstance('VaultExtension');
    vaultAdmin = await task.deployedInstance('VaultAdmin');
    protocolFeeController = await task.deployedInstance('ProtocolFeeController');
  });

  it('checks vault address', async () => {
    expect(vault.address).to.be.eq(expectedAddress);
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
    expect(await vaultAdmin.getPauseWindowEndTime()).to.be.equal(await fromNow(MONTH * 12 * 4));
    expect(await vaultAdmin.getBufferPeriodDuration()).to.be.equal(MONTH * 6);
    expect(await vaultAdmin.getBufferPeriodEndTime()).to.be.equal(await fromNow(MONTH * 12 * 4 + MONTH * 6));
  });

  it('checks extension', async () => {
    expect(await vault.getVaultExtension()).to.be.eq(vaultExtension.address);
  });

  it('checks admin', async () => {
    expect(await vaultExtension.getVaultAdmin()).to.be.eq(vaultAdmin.address);
  });
});
