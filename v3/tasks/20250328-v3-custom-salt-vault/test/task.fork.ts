import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, impersonate, Task, TaskMode } from '@src';
import { VaultFactoryDeployment } from '../input';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { fp } from '@helpers/numbers';
import { fromNow, MONTH } from '@helpers/time';

describeForkTest('V3-CustomSalt-Vault', 'avalanche', 20993984, function () {
  let task: Task;
  let vault: Contract;
  let vaultExtension: Contract;
  let vaultAdmin: Contract;
  let deployer: SignerWithAddress;
  let input: VaultFactoryDeployment;

  const deployerAddress = '0xeb12e16955efe9c728b5cccf8cf188af4ae92f94';

  before('run task', async () => {
    task = new Task('20250328-v3-custom-salt-vault', TaskMode.TEST, getForkedNetwork(hre));
    deployer = await impersonate(deployerAddress, fp(100));
    await task.run({ force: true, from: deployer });

    vault = await task.deployedInstance('Vault');
    vaultExtension = await task.deployedInstance('VaultExtension');
    vaultAdmin = await task.deployedInstance('VaultAdmin');

    input = task.input() as VaultFactoryDeployment;
  });

  it('checks vault address', async () => {
    expect(vault.address).to.be.eq(input.targetVaultAddress);
  });

  it('checks admin reference', async () => {
    expect(await vaultAdmin.vault()).to.be.equal(vault.address);
  });

  it('checks extension reference', async () => {
    expect(await vaultExtension.vault()).to.be.equal(vault.address);
  });

  it('checks protocol fee controller reference', async () => {
    const vaultAsExtension = vaultExtension.attach(vault.address);
    expect(await vaultAsExtension.getProtocolFeeController()).to.be.equal(task.output().ProtocolFeeController);
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
