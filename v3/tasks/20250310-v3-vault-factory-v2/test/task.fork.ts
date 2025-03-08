import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, impersonate, Task, TaskMode } from '@src';
import { MONTH, fromNow } from '@helpers/time';
import { VaultFactoryDeployment } from '../input';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { fp } from '@helpers/numbers';

describeForkTest('V3-VaultFactory-V2', 'arbitrum', 313264797, function () {
  let task: Task;
  let vaultFactory: Contract;
  let feeController: Contract;
  let vault: Contract;
  let vaultExtension: Contract;
  let deployer: SignerWithAddress;
  let input: VaultFactoryDeployment;

  const deployerAddress = '0x3877188e9e5DA25B11fDb7F5E8D4fDDDCE2d2270';

  before('run task', async () => {
    task = new Task('20250310-v3-vault-factory-v2', TaskMode.TEST, getForkedNetwork(hre));
    deployer = await impersonate(deployerAddress, fp(100));
    await task.run({ force: true, from: deployer });

    // TODO replace with READ_ONLY after deployment.
    const feeControllerTask = new Task('20250310-v3-protocol-fee-controller-v2', TaskMode.TEST, getForkedNetwork(hre));
    await feeControllerTask.run({ force: true });
    feeController = await feeControllerTask.deployedInstance('ProtocolFeeController');

    vaultFactory = await task.deployedInstance('VaultFactory');

    input = task.input() as VaultFactoryDeployment;
  });

  it.skip('can deploy the Vault with an external fee controller', async () => {
    await task.deployFactoryContracts(
      await vaultFactory.populateTransaction.create(
        input.salt,
        input.targetVaultAddress,
        feeController.address,
        input.vaultCreationCode,
        input.vaultExtensionCreationCode,
        input.vaultAdminCreationCode,
        { gasLimit: 17e6 }
      ),
      ['Vault', 'VaultExtension', 'VaultAdmin'],
      (await vaultFactory.isDeployed(input.targetVaultAddress)) === false,
      deployer,
      true
    );
  
    vault = await task.deployedInstance('Vault');
    vaultExtension = await task.deployedInstance('VaultExtension');
    const vaultExtensionAddress = await vaultFactory.deployedVaultExtensions(input.targetVaultAddress);
    expect (vaultExtensionAddress).to.eq(vaultExtension.address);

    const vaultAsExtension = vaultExtension.attach(vault.address);
    const controllerAddress = await vaultAsExtension.getProtocolFeeController();
    expect(controllerAddress).to.eq(feeController.address);
  });
});
