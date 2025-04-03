import { VaultDeployment } from './input';
import { Task, TaskMode, TaskRunOptions } from '@src';
import { ethers } from 'hardhat';

const skipCheckNetworkList = ['avalanche', 'optimism'];

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  if (task.mode === TaskMode.CHECK && skipCheckNetworkList.includes(task.network)) {
    // Vault was deployed in another task; skip check.
    return;
  }

  const input = task.input() as VaultDeployment;

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

  const deployTransaction = await task.deployFactoryContracts(
    await vaultFactory.populateTransaction.create(
      input.salt,
      vaultAddress,
      input.vaultCreationCode,
      input.vaultExtensionCreationCode,
      input.vaultAdminCreationCode,
      { gasLimit: 17e6 }
    ),
    ['Vault', 'VaultExtension', 'VaultAdmin', 'ProtocolFeeController'],
    (await vaultFactory.isDeployed(vaultAddress)) === false,
    from,
    force
  );

  const protocolFeeControllerAddress = await vaultFactory.deployedProtocolFeeControllers(vaultAddress);
  const vaultAdminAddress = await vaultFactory.deployedVaultAdmins(vaultAddress);
  const vaultExtensionAddress = await vaultFactory.deployedVaultExtensions(vaultAddress);

  await task.saveAndVerifyFactoryContracts(
    [
      {
        name: 'ProtocolFeeController',
        expectedAddress: protocolFeeControllerAddress,
        args: [vaultAddress],
      },
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
        args: [vaultExtensionAddress, input.Authorizer, protocolFeeControllerAddress],
      },
    ],
    deployTransaction
  );
};
