import { VaultFactoryDeployment } from './input';
import { Task, TaskMode, TaskRunOptions } from '@src';
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

  // Sanity check that the factory was deployed correctly.
  const vaultAddress = await vaultFactory.getDeploymentAddress(input.salt);
  if (vaultAddress !== input.targetVaultAddress) {
    throw Error('Incorrect target address');
  }

  // Deploy the ProtocolFeeController, as it won't be there yet on new chains.
  // Must be AFTER the VaultFactory, or the deployer account nonce will be incorrect.
  const args = [vaultAddress, input.InitialGlobalProtocolSwapFee, input.InitialGlobalProtocolYieldFee];
  const protocolFeeController = await task.deployAndVerify('ProtocolFeeController', args, from, force);

  // Deploy the Vault contracts.
  const deployTransaction = await task.deployFactoryContracts(
    await vaultFactory.populateTransaction.create(
      input.salt,
      vaultAddress,
      protocolFeeController.address,
      input.vaultCreationCode,
      input.vaultExtensionCreationCode,
      input.vaultAdminCreationCode,
      { gasLimit: 15e6 }
    ),
    ['Vault', 'VaultExtension', 'VaultAdmin'],
    (await vaultFactory.isDeployed(vaultAddress)) === false,
    from,
    force
  );

  const vaultAdminAddress = await vaultFactory.deployedVaultAdmins(vaultAddress);
  const vaultExtensionAddress = await vaultFactory.deployedVaultExtensions(vaultAddress);

  // Pass this in, since the artifacts are not included in this task.
  const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY);

  // NOTE: contractsInfo must be sorted by deployment order
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
    deployTransaction,
    vaultTask
  );
};
