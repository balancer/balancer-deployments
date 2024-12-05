import { VaultDeployment } from './input';
import { Task, TaskRunOptions } from '@src';
import { ethers } from 'hardhat';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
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

  // Skip deployment if it's already done
  if ((await vaultFactory.isDeployed(vaultAddress)) === false) {
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
      from,
      force
    );

    if (deployTransaction) {
      const protocolFeeControllerAddress = await vaultFactory.deployedProtocolFeeControllers(vaultAddress);
      const vaultExtensionAddress = await vaultFactory.deployedVaultExtensions(vaultAddress);
      const vaultAdminAddress = await vaultFactory.deployedVaultAdmins(vaultAddress);

      await task.saveAndVerifyFactoryContracts(deployTransaction, [
        {
          name: 'Vault',
          expectedAddress: vaultAddress,
          args: [vaultAddress, input.Authorizer, await vaultFactory.deployedProtocolFeeControllers(vaultAddress)],
        },
        {
          name: 'VaultExtension',
          expectedAddress: vaultExtensionAddress,
          args: [vaultAddress, vaultAdminAddress],
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
          name: 'ProtocolFeeController',
          expectedAddress: protocolFeeControllerAddress,
          args: [vaultAddress],
        },
      ]);
    }
  }
};
