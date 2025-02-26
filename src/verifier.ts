import { BuildInfo, CompilerInput, Libraries, Network } from 'hardhat/types';
import * as parser from '@solidity-parser/parser';
import { Etherscan } from '@nomicfoundation/hardhat-verify/etherscan';

import Task from './task';
import { findContractSourceName, getAllFullyQualifiedNames } from './buildinfo';
import { encodeArguments, sleep } from '@nomicfoundation/hardhat-verify/internal/utilities';
import {
  extractMatchingContractInformation,
  getLibraryInformation,
} from '@nomicfoundation/hardhat-verify/internal/solc/artifacts';
import { Bytecode } from '@nomicfoundation/hardhat-verify/internal/solc/bytecode';
import { ApiKey, ChainConfig } from '@nomicfoundation/hardhat-verify/types';
import logger from 'logger';

const MAX_VERIFICATION_INTENTS = 3;

export default class Verifier {
  etherscanInstance: Etherscan;
  network: Network;

  constructor(_network: Network, _apiKey: ApiKey | undefined, _chainConfig: ChainConfig) {
    this.network = _network;

    this.etherscanInstance = Etherscan.fromChainConfig(_apiKey, _chainConfig);
  }

  async call(
    task: Task,
    name: string,
    address: string,
    constructorArguments: string | unknown[],
    libraries: Libraries = {},
    intent = 1
  ): Promise<string> {
    const response = await this.verify(task, name, address, constructorArguments, libraries);

    if (response.isSuccess()) {
      return this.etherscanInstance.getContractUrl(address);
    } else if (intent < MAX_VERIFICATION_INTENTS && response.isBytecodeMissingInNetworkError()) {
      logger.info(`Could not find deployed bytecode in network, retrying ${intent++}/${MAX_VERIFICATION_INTENTS}...`);
      sleep(5000);
      return this.call(task, name, address, constructorArguments, libraries, intent++);
    } else {
      throw new Error(`The contract verification failed. Reason: ${response.message}`);
    }
  }

  private async verify(task: Task, name: string, address: string, args: string | unknown[], libraries: Libraries = {}) {
    const deployedBytecode = await Bytecode.getDeployedContractBytecode(
      address,
      this.network.provider,
      this.network.name
    );

    let buildInfos: BuildInfo[];
    try {
      // First check if there's a specific file named like this.
      buildInfos = [task.buildInfo(name)];
    } catch {
      // Otherwise search in every file.
      buildInfos = task.buildInfos();
    }
    const buildInfo = this.findBuildInfoWithContract(buildInfos, name);

    const sourceName = findContractSourceName(buildInfo, name);
    const fullSourceName = `${sourceName}:${name}`;

    const contractInformation = await extractMatchingContractInformation(fullSourceName, buildInfo, deployedBytecode);
    if (!contractInformation) throw Error('Could not find a bytecode matching the requested contract');

    const libraryInformation = await getLibraryInformation(contractInformation, libraries);
    buildInfo.input.settings.libraries = libraryInformation.libraries;

    const deployArgumentsEncoded =
      typeof args == 'string'
        ? args
        : await encodeArguments(
            contractInformation.contractOutput.abi,
            contractInformation.sourceName,
            contractInformation.contractName,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            args as any[]
          );

    const { message: guid } = await this.etherscanInstance.verify(
      address,
      JSON.stringify(buildInfo.input),
      fullSourceName,
      `v${contractInformation.solcLongVersion}`,
      deployArgumentsEncoded
    );

    await sleep(1000);

    const verificationStatus = await this.etherscanInstance.getVerificationStatus(guid);

    if (verificationStatus.isFailure() || verificationStatus.isSuccess()) {
      return verificationStatus;
    }

    throw new Error(`The API responded with an unexpected message: ${verificationStatus.message}`);
  }

  private findBuildInfoWithContract(buildInfos: BuildInfo[], contractName: string): BuildInfo {
    const found = buildInfos.find((buildInfo) =>
      getAllFullyQualifiedNames(buildInfo).some((name) => name.contractName === contractName)
    );

    if (found === undefined) {
      throw Error(`Could not find a build info for contract ${contractName}`);
    } else {
      return found;
    }
  }
}
