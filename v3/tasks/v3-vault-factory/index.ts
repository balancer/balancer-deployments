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

  console.log('stage 1');
  await vaultFactory.createStage1(vaultAddress, input.vaultAdminCreationCode);

  console.log('stage 2');
  await vaultFactory.createStage2(input.vaultExtensionCreationCode);

  console.log('about to create');
  await vaultFactory.createStage3(input.salt, vaultAddress, input.vaultCreationCode);
  console.log('CREATED');

  const protocolFeeControllerAddress = await vaultFactory.protocolFeeController();
  const vaultExtensionAddress = await vaultFactory.vaultExtension();
  const vaultAdminAddress = await vaultFactory.vaultAdmin();

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
