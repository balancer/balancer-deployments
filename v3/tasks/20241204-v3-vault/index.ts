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
    await vaultFactory.create(
      input.salt,
      vaultAddress,
      input.vaultCreationCode,
      input.vaultExtensionCreationCode,
      input.vaultAdminCreationCode,
      { gasLimit: 17e6 }
    );
  }

  const protocolFeeControllerAddress = await vaultFactory.deployedProtocolFeeControllers(vaultAddress);
  const vaultExtensionAddress = await vaultFactory.deployedVaultExtensions(vaultAddress);
  const vaultAdminAddress = await vaultFactory.deployedVaultAdmins(vaultAddress);

  await task.verify('Vault', vaultAddress, [vaultExtensionAddress, input.Authorizer, protocolFeeControllerAddress]);
  await task.verify('VaultExtension', vaultExtensionAddress, [vaultAddress, vaultAdminAddress]);
  await task.verify('VaultAdmin', vaultAdminAddress, [
    vaultAddress,
    input.pauseWindowDuration,
    input.bufferPeriodDuration,
    input.minTradeAmount,
    input.minWrapAmount,
  ]);
  await task.verify('ProtocolFeeController', protocolFeeControllerAddress, [vaultAddress]);

  await task.save({ Vault: vaultAddress });
  await task.save({ VaultExtension: vaultExtensionAddress });
  await task.save({ VaultAdmin: vaultAdminAddress });
  await task.save({ ProtocolFeeController: protocolFeeControllerAddress });
};
