import { Contract } from 'ethers';
import { Artifacts } from 'hardhat/internal/artifacts';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

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
  return deployment.deployed();
}

export async function deployVyper(
  contract: Artifact | string,
  args: Array<Param> = [],
  from?: SignerWithAddress
): Promise<Contract> {
  if (!args) args = [];
  if (!from) from = await getSigner();

  const artifact: Artifact = typeof contract === 'string' ? getArtifact(contract) : contract;
  const transformedAbi = transformVyperAbi(artifact.abi);

  const { ethers } = await import('hardhat');

  // Create factory with transformed ABI; Vyper can't handle arrays (tuples in the ABI).
  const factory = new ethers.ContractFactory(transformedAbi, artifact.bytecode, from);

  const deployment = await factory.deploy(...args);

  return deployment.deployed();
}

export async function instanceAt(contract: Artifact | string, address: string): Promise<Contract> {
  const artifact: Artifact = typeof contract === 'string' ? getArtifact(contract) : contract;

  const { ethers } = await import('hardhat');
  return ethers.getContractAt(artifact.abi, address);
}

export async function deploymentTxData(artifact: Artifact, args: Array<Param> = [], libs?: Libraries): Promise<string> {
  const { ethers } = await import('hardhat');
  const factory = await ethers.getContractFactoryFromArtifact(artifact, { libraries: libs });

  const { data } = factory.getDeployTransaction(...args);
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

// Function to transform Vyper ABI to ethers.js v5 compatible format
function transformVyperAbi(abi: any[]): any[] {
  return abi.map((item) => {
    if (item.type === 'constructor' && item.inputs) {
      return {
        ...item,
        inputs: item.inputs.map((input: any) => transformInput(input)),
      };
    }
    return item;
  });
}

function transformInput(input: any): any {
  if (input.type.includes('(') && input.type.includes(')')) {
    // Extract the tuple definition and array size
    const match = input.type.match(/\((.*?)\)(\[.*?\])?/);
    if (match) {
      const tupleTypes = match[1].split(',');
      const arraySize = match[2] || '';

      return {
        ...input,
        type: `tuple${arraySize}`,
        components: tupleTypes.map((type: string, index: number) => ({
          name: `field${index}`,
          type: type.trim(),
        })),
      };
    }
  }
  return input;
}
