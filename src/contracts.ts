import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { Contract } from 'ethers';
import { Artifacts } from 'hardhat/internal/artifacts';

import { getSigner } from './signers';
import { Artifact, Libraries, Param } from './types';
import path from 'path';
import * as Config from '../hardhat.config';

export async function deploy(
  contract: Artifact | string,
  args: Array<Param> = [],
  from?: SignerWithAddress,
  libs?: Libraries
): Promise<Contract> {
  if (!args) args = [];
  if (!from) from = await getSigner();

  const artifact: Artifact = typeof contract === 'string' ? getArtifact(contract) : contract;

  const { ethers } = await import('hardhat');
  const factory = await ethers.getContractFactoryFromArtifact(artifact, { libraries: libs });
  const deployment = await factory.connect(from).deploy(...args);
  return deployment.waitForDeployment() as Promise<Contract>;
}

export async function instanceAt(contract: Artifact | string, address: string): Promise<Contract> {
  const artifact: Artifact = typeof contract === 'string' ? getArtifact(contract) : contract;

  const { ethers } = await import('hardhat');
  return ethers.getContractAt(artifact.abi, address);
}

export async function deploymentTxData(artifact: Artifact, args: Array<Param> = [], libs?: Libraries): Promise<string> {
  const { ethers } = await import('hardhat');
  const factory = await ethers.getContractFactoryFromArtifact(artifact, { libraries: libs });

  const tx = await factory.getDeployTransaction(...args);
  const { data } = tx;
  if (data === undefined) throw new Error('Deploy transaction with no data. Something is very wrong');

  return data.toString();
}

export function getArtifact(contract: string): Artifact {
  let artifactsPath: string;
  if (!contract.includes('/')) {
    artifactsPath = path.resolve(Config.default.paths.artifacts);
  } else {
    const packageName = `@balancer-labs/${contract.split('/')[0]}`;
    const packagePath = path.dirname(require.resolve(`${packageName}/package.json`));
    artifactsPath = `${packagePath}/artifacts`;
  }

  const artifacts = new Artifacts(artifactsPath);
  return artifacts.readArtifactSync(contract.split('/').slice(-1)[0]);
}
