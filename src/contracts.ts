import { Contract } from 'ethers';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

import { getSigner } from './signers';
import type { Artifact, Libraries, Param, SignerWithAddress } from './types';
import * as Config from '../hardhat.config';

const nodeRequire = createRequire(path.resolve(process.cwd(), 'package.json'));

function withContractCompat(contract: Contract): Contract {
  const contractWithCompat = contract as any;

  if (contractWithCompat.address === undefined) {
    if (typeof contractWithCompat.target === 'string') {
      contractWithCompat.address = contractWithCompat.target;
    }
  }

  if (
    contractWithCompat.deployTransaction === undefined &&
    typeof contractWithCompat.deploymentTransaction === 'function'
  ) {
    contractWithCompat.deployTransaction = contractWithCompat.deploymentTransaction();
  }

  const buildNamespaceProxy = (methodName: 'staticCall' | 'populateTransaction' | 'estimateGas') =>
    new Proxy(
      {},
      {
        get(_target, property) {
          if (typeof property !== 'string') {
            return undefined;
          }

          return (...args: unknown[]) => {
            const method =
              contractWithCompat.getFunction?.(property) ??
              (contractWithCompat[property] as
                | {
                    [key in 'staticCall' | 'populateTransaction' | 'estimateGas']?: (...methodArgs: unknown[]) => unknown;
                  }
                | undefined);

            const methodImpl = method?.[methodName];
            if (typeof methodImpl !== 'function') {
              throw new Error(`Function ${property} does not support ${methodName}`);
            }

            return methodImpl(...args);
          };
        },
      }
    );

  contractWithCompat.callStatic = buildNamespaceProxy('staticCall');
  contractWithCompat.populateTransaction = buildNamespaceProxy('populateTransaction');
  contractWithCompat.estimateGas = buildNamespaceProxy('estimateGas');

  if (contractWithCompat.__withCompatPatched !== true) {
    const originalConnect = contractWithCompat.connect?.bind(contractWithCompat);
    if (typeof originalConnect === 'function') {
      contractWithCompat.connect = (runner: unknown) => withContractCompat(originalConnect(runner));
    }

    const originalAttach = contractWithCompat.attach?.bind(contractWithCompat);
    if (typeof originalAttach === 'function') {
      contractWithCompat.attach = (target: string) => withContractCompat(originalAttach(target));
    }

    contractWithCompat.__withCompatPatched = true;
  }

  return contractWithCompat;
}

export async function deploy(
  contract: Artifact | string,
  args: Array<Param> = [],
  from?: SignerWithAddress,
  libs?: Libraries
): Promise<Contract> {
  if (!args) args = [];
  if (!from) from = await getSigner();

  const artifact: Artifact = typeof contract === 'string' ? getArtifact(contract) : contract;

  const { ethers } = await import('@src/hardhatCompat');
  const factory = await ethers.getContractFactoryFromArtifact(artifact, { libraries: libs });
  const deployment = await factory.connect(from).deploy(...args);
  await deployment.waitForDeployment();
  return withContractCompat(deployment as Contract);
}

export async function instanceAt(contract: Artifact | string, address: string): Promise<Contract> {
  const artifact: Artifact = typeof contract === 'string' ? getArtifact(contract) : contract;

  const { ethers } = await import('@src/hardhatCompat');
  const instance = await ethers.getContractAt(artifact.abi, address);
  return withContractCompat(instance as Contract);
}

export async function deploymentTxData(artifact: Artifact, args: Array<Param> = [], libs?: Libraries): Promise<string> {
  const { ethers } = await import('@src/hardhatCompat');
  const factory = await ethers.getContractFactoryFromArtifact(artifact, { libraries: libs });

  const { data } = await factory.getDeployTransaction(...args);
  if (data === undefined) throw new Error('Deploy transaction with no data. Something is very wrong');

  return data.toString();
}

export function getArtifact(contract: string): Artifact {
  let artifactsPath: string;
  if (!contract.includes('/')) {
    artifactsPath = path.resolve(Config.default.paths.artifacts);
  } else {
    const packageName = `@balancer-labs/${contract.split('/')[0]}`;
    const packagePath = path.dirname(nodeRequire.resolve(`${packageName}/package.json`));
    artifactsPath = `${packagePath}/artifacts`;
  }

  const contractName = contract.split('/').slice(-1)[0];
  const artifactFile = findArtifactFileWithFallback(artifactsPath, contractName);
  return JSON.parse(fs.readFileSync(artifactFile, 'utf8')) as Artifact;
}

function findArtifactFileWithFallback(primaryRoot: string, contractName: string): string {
  try {
    return findArtifactFile(primaryRoot, contractName);
  } catch (error) {
    const taskArtifactFile = findTaskArtifactFile(contractName);
    if (taskArtifactFile !== undefined) {
      return taskArtifactFile;
    }

    const nodeModulesArtifactFile = findNodeModulesArtifactFile(contractName);
    if (nodeModulesArtifactFile !== undefined) {
      return nodeModulesArtifactFile;
    }

    throw error;
  }
}

function findTaskArtifactFile(contractName: string): string | undefined {
  const target = `${contractName}.json`;
  const taskRoots = [path.resolve('v2/tasks'), path.resolve('v3/tasks')];

  for (const taskRoot of taskRoots) {
    if (!fs.existsSync(taskRoot)) {
      continue;
    }

    for (const entry of fs.readdirSync(taskRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const candidate = path.join(taskRoot, entry.name, 'artifact', target);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return undefined;
}

function findNodeModulesArtifactFile(contractName: string): string | undefined {
  // Some legacy tests instantiate interfaces (e.g. IERC20) without task-local artifacts.
  // Reuse canonical artifacts shipped by common dependencies in node_modules.
  const wellKnownCandidates = [
    path.resolve('node_modules', '@openzeppelin', 'contracts', 'build', 'contracts', `${contractName}.json`),
  ];

  for (const candidate of wellKnownCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function findArtifactFile(root: string, contractName: string): string {
  const stack = [root];
  const target = `${contractName}.json`;

  while (stack.length > 0) {
    const dir = stack.pop() as string;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(filePath);
        continue;
      }

      if (entry.isFile() && entry.name === target && !entry.name.endsWith('.dbg.json')) {
        return filePath;
      }
    }
  }

  throw new Error(`Could not find artifact ${target} under ${root}`);
}
