import { VaultFactoryDeployment } from './input';
import { deploy, Task, TaskMode, TaskRunOptions } from '@src';
import { ethers } from 'hardhat';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as VaultFactoryDeployment;

  const vaultFactoryArgs = [
    input.Authorizer,
    input.pauseWindowDuration,
    input.bufferPeriodDuration,
    input.minTradeAmount,
    input.minWrapAmount,
    ethers.utils.keccak256(input.vaultCreationCode),
    ethers.utils.keccak256(input.vaultExtensionCreationCode),
    ethers.utils.keccak256(input.vaultAdminCreationCode),
  ];

  const vaultFactory = await task.deployAndVerify('VaultFactory', vaultFactoryArgs, from, force);

  const vaultAddress = await vaultFactory.getDeploymentAddress(input.salt);
  if (vaultAddress !== input.targetVaultAddress) {
    throw Error('Incorrect target address');
  }

  // Deploy the ProtocolFeeController from the artifact. (Must be AFTER the VaultFactory).
  const feeControllerTask = new Task('20250214-v3-protocol-fee-controller-v2', TaskMode.READ_ONLY);
  const args = [vaultAddress, input.InitialGlobalProtocolSwapFee, input.InitialGlobalProtocolYieldFee];

  const protocolFeeController = await deploy(feeControllerTask.artifact('ProtocolFeeController'), args, from);
  task.save({ ProtocolFeeController: protocolFeeController.address });

  await feeControllerTask.verify('ProtocolFeeController', protocolFeeController.address, args);

  const deployTransaction = await task.deployFactoryContracts(
    await vaultFactory.populateTransaction.create(
      input.salt,
      vaultAddress,
      protocolFeeController.address,
      input.vaultCreationCode,
      input.vaultExtensionCreationCode,
      input.vaultAdminCreationCode,
      { gasLimit: 17e6 }
    ),
    ['Vault', 'VaultExtension', 'VaultAdmin'],
    (await vaultFactory.isDeployed(vaultAddress)) === false,
    from,
    force
  );

  const vaultAdminAddress = await vaultFactory.deployedVaultAdmins(vaultAddress);
  const vaultExtensionAddress = await vaultFactory.deployedVaultExtensions(vaultAddress);

  await task.saveAndVerifyFactoryContracts(
    [
      {
        name: 'VaultAdmin',
        expectedAddress: vaultAdminAddress,
        args: [
          vaultAddress,
          input.pauseWindowDuration,
          input.bufferPeriodDuration,
          input.minTradeAmount,
          input.minWrapAmount,
        ],
      },
      {
        name: 'VaultExtension',
        expectedAddress: vaultExtensionAddress,
        args: [vaultAddress, vaultAdminAddress],
      },
      {
        name: 'Vault',
        expectedAddress: vaultAddress,
        args: [vaultExtensionAddress, input.Authorizer, protocolFeeController.address],
      },
    ],
    deployTransaction
  );
};
