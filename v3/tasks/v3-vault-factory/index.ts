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

  // console.log('stage 1');
  // await vaultFactory.createStage1(vaultAddress, input.vaultAdminCreationCode);

  // console.log('stage 2');
  // await vaultFactory.createStage2(input.vaultExtensionCreationCode);

  // console.log('about to create');
  // await vaultFactory.createStage3(input.salt, vaultAddress, input.vaultCreationCode);
  // console.log('CREATED');

  // const protocolFeeControllerAddress = await vaultFactory.protocolFeeController();
  // const vaultExtensionAddress = await vaultFactory.vaultExtension();
  // const vaultAdminAddress = await vaultFactory.vaultAdmin();

  const protocolFeeController = await task.deployAndVerify('ProtocolFeeController', [vaultAddress], from, force);
  const vaultAdmin = await task.deployAndVerify(
    'VaultAdmin',
    [vaultAddress, input.pauseWindowDuration, input.bufferPeriodDuration, input.minTradeAmount, input.minWrapAmount],
    from,
    force
  );

  const vaultExtension = await task.deployAndVerify('VaultExtension', [vaultAddress, vaultAdmin.address], from, force);

  console.log('deploying proxy');
  await vaultFactory.deployProxy(input.salt);

  console.log('protocol fee controller vault: ', await protocolFeeController.vault());
  console.log('vault extension vault: ', await vaultExtension.vault());

  console.log('About to deploy vault at ', vaultAddress);

  // ethers.utils.solidityPack(
  //   ['bytes', 'bytes'],
  //   [
  //     input.vaultCreationCode,
  //     ethers.utils.toUtf8Bytes(
  //       ethers.utils.defaultAbiCoder.encode(
  //         ['address', 'address', 'address'],
  //         [vaultExtension.address, input.Authorizer, protocolFeeController.address]
  //       )
  //     ),
  //   ]
  // )

  await vaultFactory.createStage3(
    input.salt,
    input.vaultCreationCode,
    vaultExtension.address,
    protocolFeeController.address
  );
  console.log('vault deployed');

  await task.verify('Vault', vaultAddress, [vaultExtension.address, input.Authorizer, protocolFeeController.address]);
  // await task.verify('VaultExtension', vaultExtensionAddress, [vaultAddress, vaultAdminAddress]);
  // await task.verify('VaultAdmin', vaultAdminAddress, [
  //   vaultAddress,
  //   input.pauseWindowDuration,
  //   input.bufferPeriodDuration,
  //   input.minTradeAmount,
  //   input.minWrapAmount,
  // ]);
  // await task.verify('ProtocolFeeController', protocolFeeControllerAddress, [vaultAddress]);

  // await task.save({ Vault: vaultAddress });
  // await task.save({ VaultExtension: vaultExtensionAddress });
  // await task.save({ VaultAdmin: vaultAdminAddress });
  // await task.save({ ProtocolFeeController: protocolFeeControllerAddress });
};
