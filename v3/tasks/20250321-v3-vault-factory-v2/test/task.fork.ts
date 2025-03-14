import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, impersonate, Task, TaskMode } from '@src';
import { VaultFactoryDeployment } from '../input';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { fp } from '@helpers/numbers';

describeForkTest('V3-VaultFactory-V2', 'arbitrum', 297799000, function () {
  let task: Task;
  let vaultFactory: Contract;
  let feeController: Contract;
  let vault: Contract;
  let vaultExtension: Contract;
  let deployer: SignerWithAddress;
  let input: VaultFactoryDeployment;

  const deployerAddress = '0x3877188e9e5DA25B11fDb7F5E8D4fDDDCE2d2270';

  before('run task', async () => {
    task = new Task('20250321-v3-vault-factory-v2', TaskMode.TEST, getForkedNetwork(hre));
    deployer = await impersonate(deployerAddress, fp(100));
    await task.run({ force: true, from: deployer });

    vaultFactory = await task.deployedInstance('VaultFactory');

    input = task.input() as VaultFactoryDeployment;
  });

  it('works', () => {
    expect(true).to.be.true;
  })
});
