import fs from 'fs';
import path, { extname } from 'path';
import { BuildInfo, CompilerOutputContract } from 'hardhat/types';
import { Contract, ethers } from 'ethers';
import { hexToBytes, Address } from '@ethereumjs/util';
import { Chain, Common, Hardfork } from '@ethereumjs/common';
import { EVM } from '@ethereumjs/evm';
import { getContractAddress } from '@ethersproject/address';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import logger from './logger';
import Verifier from './verifier';
import { deploy, deploymentTxData, instanceAt } from './contracts';

import {
  NETWORKS,
  Network,
  Libraries,
  Artifact,
  Input,
  Output,
  Param,
  RawInputKeyValue,
  RawOutput,
  TaskRunOptions,
} from './types';
import { getContractDeploymentTransactionHash, saveContractDeploymentTransactionHash } from './network';
import { getTaskActionIds } from './actionId';
import { getArtifactFromContractOutput } from './artifact';
import { getSigner } from './signers';

// Maps to ../v2 and ../v3.
const VERSION_ROOTS = ['v2', 'v3'].map((version) => path.resolve(__dirname, `../${version}`));

// Maps to v2/tasks, v3/tasks, etc.
const getTasksDir = (versionRoot: string) => path.resolve(versionRoot, 'tasks');
const getDeprecatedDir = (versionRoot: string) => path.resolve(versionRoot, 'deprecated');
const getScriptsDir = (versionRoot: string) => path.resolve(versionRoot, 'scripts');

export enum TaskMode {
  LIVE, // Deploys and saves outputs
  TEST, // Deploys but saves to test output
  CHECK, // Checks past deployments on deploy
  READ_ONLY, // Fails on deploy
}

export enum TaskStatus {
  ACTIVE,
  DEPRECATED,
  SCRIPT,
}

type ContractInfo = {
  name: string;
  expectedAddress: string;
  args: Array<Param>;
};

/* eslint-disable @typescript-eslint/no-var-requires */

export default class Task {
  id: string;
  mode: TaskMode;
  evm: Promise<EVM>;

  _network?: Network;
  _verifier?: Verifier;

  constructor(idAlias: string, mode: TaskMode, network?: Network, verifier?: Verifier) {
    if (network && !NETWORKS.includes(network)) throw Error(`Unknown network ${network}`);
    this.id = this._findTaskId(idAlias);
    this.mode = mode;
    this._network = network;
    this._verifier = verifier;
    this.evm = this.createEVM();
  }

  get network(): string {
    if (!this._network) throw Error('No network defined');
    return this._network;
  }

  set network(name: Network) {
    this._network = name;
  }

  async instanceAt(name: string, address: string): Promise<Contract> {
    return instanceAt(this.artifact(name), address);
  }

  async deployedInstance(name: string): Promise<Contract> {
    const address = this.output()[name];
    if (!address) throw Error(`Could not find deployed address for ${name}`);
    return this.instanceAt(name, address);
  }

  async optionalDeployedInstance(name: string): Promise<Contract | undefined> {
    let instance: Contract;
    try {
      instance = await this.deployedInstance(name);
      return instance;
    } catch {
      return undefined;
    }
  }

  async inputInstance(artifactName: string, inputName: string): Promise<Contract> {
    const rawInput = this.rawInput();
    const input = rawInput[inputName];
    if (!this._isTask(input)) throw Error(`Cannot access to non-task input ${inputName}`);
    const task = input as Task;
    task.network = this.network;
    const address = this._parseRawInput(rawInput)[inputName];
    return task.instanceAt(artifactName, address);
  }

  async deployAndVerify(
    name: string,
    args: Array<Param> = [],
    from?: SignerWithAddress,
    force?: boolean,
    libs?: Libraries
  ): Promise<Contract> {
    if (this.mode == TaskMode.CHECK) {
      return await this.check(name, args, libs);
    }

    const instance = await this.deploy(name, args, from, force, libs);

    await this.verify(name, instance.address, args, libs);
    return instance;
  }

  async deployFactoryContracts(
    populatedDeployTransaction: ethers.PopulatedTransaction,
    expectedContracts: Array<string>,
    needsDeploy: boolean,
    from?: SignerWithAddress,
    force?: boolean
  ): Promise<ethers.providers.TransactionReceipt | undefined> {
    if (!needsDeploy || this.mode == TaskMode.CHECK) {
      return undefined;
    }

    const output = this.output({ ensure: false });

    if (force == false) {
      let needsDeploy = false;
      for (const name of expectedContracts) {
        if (!output[name]) {
          needsDeploy = true;
        }

        logger.info(`${name} already deployed at ${output[name]}`);
      }

      if (needsDeploy) {
        logger.info('Some contracts were not deployed, re-deploying all contracts for this transaction...');
      } else {
        return undefined;
      }
    }

    logger.info(`Deploying contracts using factory...`);

    from = from || (await getSigner());
    const receipt = await from?.sendTransaction(populatedDeployTransaction);

    return await receipt.wait();
  }

  // NOTE: contractsInfo must be sorted by deployment order
  async saveAndVerifyFactoryContracts(
    contractsInfo: Array<ContractInfo>,
    deployTransaction?: ethers.providers.TransactionReceipt,
    externalTask?: Task,
    factoryAddress?: string
  ): Promise<void> {
    const { ethers } = await import('hardhat');

    if (deployTransaction == null) {
      // All contracts are deployed by the one factory transaction, so we can find the transaction hash by the first element
      const deployedAddress = this.output()[contractsInfo[0].name];
      const deploymentTxHash = getContractDeploymentTransactionHash(deployedAddress, this.network);
      deployTransaction = await ethers.provider.getTransactionReceipt(deploymentTxHash);
    }

    // Pass in an external task if the artifacts are not in the present task.
    // For instance, vault-factory-v2, where for safety we don't want to duplicate the artifacts.
    const artifactSource = externalTask === undefined ? this : externalTask;

    for (const contractInfo of contractsInfo) {
      const isDeployedBytecodeValid = await this.checkBytecodeAndSaveEVMState(
        deployTransaction,
        artifactSource.artifact(contractInfo.name),
        contractInfo.expectedAddress,
        contractInfo.args,
        factoryAddress
      );

      if (isDeployedBytecodeValid && this.mode === TaskMode.CHECK) {
        logger.success(`Verified contract '${contractInfo.name}' on network '${this.network}' of task '${this.id}'`);
      }

      if (isDeployedBytecodeValid == false) {
        throw Error(
          `Contract ${contractInfo.name} at ${contractInfo.expectedAddress} does not match expected bytecode with abi.`
        );
      }

      if (this.mode === TaskMode.CHECK) {
        continue;
      }

      const instance = await this.instanceAt(contractInfo.name, contractInfo.expectedAddress);
      this.save({ [contractInfo.name]: instance });
      logger.success(`Contract ${contractInfo.name} attached at ${contractInfo.expectedAddress}`);

      if (this.mode === TaskMode.LIVE) {
        saveContractDeploymentTransactionHash(
          contractInfo.expectedAddress,
          deployTransaction.transactionHash,
          this.network
        );
      }

      await this.verify(contractInfo.name, contractInfo.expectedAddress, contractInfo.args, undefined, externalTask);
    }
  }

  async createEVM(): Promise<EVM> {
    const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Cancun });
    const evm = await EVM.create({
      common,
    });
    return evm;
  }

  // NOTE: If a contract is deployed by a factory, we must set the factoryAddress in the function arguments.
  async checkBytecodeAndSaveEVMState(
    deployTransaction: ethers.providers.TransactionReceipt,
    artifact: Artifact,
    contractAddress: string,
    args: Array<Param> = [],
    factoryAddress?: string
  ): Promise<boolean> {
    const { ethers } = await import('hardhat');

    const runBytecode = hexToBytes(
      ethers.utils.hexlify(
        ethers.utils.concat([artifact.bytecode, new ethers.utils.Interface(artifact.abi).encodeDeploy(args)])
      )
    );

    const block = await ethers.provider.getBlock(deployTransaction.blockNumber);
    if (!block) {
      throw Error(`Could not find block ${deployTransaction.blockNumber}`);
    }

    const evm = await this.evm;
    const res = await evm.runCode({
      code: runBytecode,
      to: Address.fromString(contractAddress),
      caller: factoryAddress ? Address.fromString(factoryAddress) : Address.fromString(deployTransaction.from),
      origin: Address.fromString(deployTransaction.from),
      block: {
        header: {
          number: BigInt(block.number),
          timestamp: BigInt(block.timestamp),
          cliqueSigner: () => Address.fromString(ethers.constants.AddressZero),
          coinbase: Address.fromString(ethers.constants.AddressZero),
          difficulty: BigInt(0),
          gasLimit: block.gasLimit.toBigInt(),
          prevRandao: hexToBytes(ethers.constants.HashZero),
          baseFeePerGas: undefined,
          getBlobGasPrice: () => undefined,
        },
      },
    });

    if (res.exceptionError) {
      new Error(`computeDeployedBytecode failed: ${res.exceptionError}`);
    }

    await evm.stateManager.putContractCode(Address.fromString(contractAddress), res.returnValue);

    const deployedCode = await ethers.provider.getCode(contractAddress);
    return ethers.utils.hexValue(res.returnValue) == deployedCode;
  }

  async deploy(
    name: string,
    args: Array<Param> = [],
    from?: SignerWithAddress,
    force?: boolean,
    libs?: Libraries
  ): Promise<Contract> {
    if (this.mode == TaskMode.CHECK) {
      return await this.check(name, args, libs);
    }

    if (this.mode !== TaskMode.LIVE && this.mode !== TaskMode.TEST) {
      throw Error(`Cannot deploy in tasks of mode ${TaskMode[this.mode]}`);
    }

    let instance: Contract;
    const output = this.output({ ensure: false });
    if (force || !output[name]) {
      instance = await deploy(this.artifact(name), args, from, libs);
      this.save({ [name]: instance });
      logger.success(`Deployed ${name} at ${instance.address}`);

      if (this.mode === TaskMode.LIVE) {
        saveContractDeploymentTransactionHash(instance.address, instance.deployTransaction.hash, this.network);
      }
    } else {
      logger.info(`${name} already deployed at ${output[name]}`);
      instance = await this.instanceAt(name, output[name]);
    }

    await this.saveInInternalEVMState(instance.address);

    return instance;
  }

  async saveInInternalEVMState(address: string): Promise<void> {
    const { ethers } = await import('hardhat');
    const evm = await this.evm;

    await evm.stateManager.putContractCode(
      Address.fromString(address),
      hexToBytes(await ethers.provider.getCode(address))
    );
  }

  async verify(
    name: string,
    address: string,
    constructorArguments: string | unknown[],
    libs?: Libraries,
    externalTask?: Task
  ): Promise<void> {
    if (this.mode !== TaskMode.LIVE) {
      return;
    }

    const task = externalTask === undefined ? this : externalTask;

    try {
      if (!this._verifier) return logger.warn('Skipping contract verification, no verifier defined');
      const url = await this._verifier.call(task, name, address, constructorArguments, libs);
      logger.success(`Verified contract ${name} at ${url}`);
    } catch (error) {
      logger.error(`Failed trying to verify ${name} at ${address}: ${error}`);
    }
  }

  async check(name: string, args: Array<Param> = [], libs?: Libraries): Promise<Contract> {
    // There are multiple approaches to checking that a deployed contract matches known source code. A naive approach
    // is to check for a match in the runtime code, but that doesn't account for actions taken during construction,
    // including calls, storage writes, and setting immutable state variables. Since immutable state variables modify
    // the runtime code, it can actually be quite tricky to produce matching runtime code.
    //
    // What we do instead is check for both runtime code and constructor execution (including constructor arguments) by
    // looking at the transaction in which the contract was deployed, which can be found in the /deployment-txs directory.
    // The data of this transaction will be the contract creation code followed by the abi-encoded constructor arguments,
    // which we can compare against what the task would attempt to deploy. In this way, we are testing the task's build
    // info, inputs and deployment code.
    //
    // The only thing we're not checking is what account deployed the contract, but our code does not have dependencies
    // on the deployer.

    const { ethers } = await import('hardhat');

    const deployedAddress = this.output()[name];
    const deploymentTxHash = getContractDeploymentTransactionHash(deployedAddress, this.network);
    const deploymentTx = await ethers.provider.getTransaction(deploymentTxHash);

    const expectedDeploymentAddress = getContractAddress(deploymentTx);
    if (deployedAddress !== expectedDeploymentAddress) {
      throw Error(
        `The stated deployment address of '${name}' on network '${this.network}' of task '${this.id}' (${deployedAddress}) does not match the address which would be deployed by the transaction ${deploymentTxHash} (which instead deploys to ${expectedDeploymentAddress})`
      );
    }

    const expectedDeploymentTxData = await deploymentTxData(this.artifact(name), args, libs);
    if (deploymentTx.data === expectedDeploymentTxData) {
      logger.success(`Verified contract '${name}' on network '${this.network}' of task '${this.id}'`);
    } else {
      throw Error(
        `The build info and inputs for contract '${name}' on network '${this.network}' of task '${this.id}' does not match the data used to deploy address ${deployedAddress}`
      );
    }

    await this.saveInInternalEVMState(deployedAddress);

    // We need to return an instance so that the task may carry on, potentially using this as input of future
    // deployments.
    return this.instanceAt(name, deployedAddress);
  }

  async run(options: TaskRunOptions = {}): Promise<void> {
    const taskPath = this._fileAt(this.dir(), 'index.ts');
    const task = require(taskPath).default;
    await task(this, options);
  }

  dir(): string {
    if (!this.id) throw Error('Please provide a task deployment ID to run');

    const __dir = (versionRoot: string): string | undefined => {
      // The task might be deprecated, so it may not exist in the main directory. We first look there, but don't require
      // that the directory exists.

      const nonDeprecatedDir = this._dirAt(getTasksDir(versionRoot), this.id, false);
      if (this._existsDir(nonDeprecatedDir)) {
        return nonDeprecatedDir;
      }

      const deprecatedDir = this._dirAt(getDeprecatedDir(versionRoot), this.id, false);
      if (this._existsDir(deprecatedDir)) {
        return deprecatedDir;
      }

      const scriptsDir = this._dirAt(getScriptsDir(versionRoot), this.id, false);
      if (this._existsDir(scriptsDir)) {
        return scriptsDir;
      }

      return undefined;
    };

    for (const versionRoot of VERSION_ROOTS) {
      const dirFound = __dir(versionRoot);
      if (dirFound !== undefined) {
        return dirFound;
      }
    }

    throw Error(`Could not find a directory at ${VERSION_ROOTS}`);
  }

  version(): string {
    const taskDir = this.dir();

    const isSubdir = (parent: string, dir: string) => {
      const relative = path.relative(parent, dir);
      return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
    };

    for (const versionRoot of VERSION_ROOTS) {
      if (isSubdir(versionRoot, taskDir)) {
        return path.basename(versionRoot);
      }
    }

    throw new Error('Unknown version');
  }

  buildInfo(fileName: string): BuildInfo {
    const buildInfoDir = this._dirAt(this.dir(), 'build-info');
    const artifactFile = this._fileAt(buildInfoDir, `${extname(fileName) ? fileName : `${fileName}.json`}`);
    return JSON.parse(fs.readFileSync(artifactFile).toString());
  }

  buildInfos(): Array<BuildInfo> {
    const buildInfoDir = this._dirAt(this.dir(), 'build-info');
    return fs.readdirSync(buildInfoDir).map((fileName) => this.buildInfo(fileName));
  }

  artifact(contractName: string, fileName?: string): Artifact {
    const buildInfoDir = this._dirAt(this.dir(), 'build-info');
    fileName = fileName ?? contractName;

    const builds: {
      [sourceName: string]: { [contractName: string]: CompilerOutputContract };
    } = this._existsFile(path.join(buildInfoDir, `${fileName}.json`))
      ? this.buildInfo(fileName).output.contracts
      : this.buildInfos().reduce((result, info: BuildInfo) => ({ ...result, ...info.output.contracts }), {});

    const sourceName = Object.keys(builds).find((sourceName) =>
      Object.keys(builds[sourceName]).find((key) => key === contractName)
    );

    if (!sourceName) throw Error(`Could not find artifact for ${contractName}`);
    return getArtifactFromContractOutput(sourceName, contractName, builds[sourceName][contractName]);
  }

  actionId(contractName: string, signature: string): string {
    const taskActionIds = getTaskActionIds(this);
    if (taskActionIds === undefined) throw new Error('Could not find action IDs for task');
    const contractInfo = taskActionIds[contractName];
    if (contractInfo === undefined)
      throw new Error(`Could not find action IDs for contract ${contractName} on task ${this.id}`);
    const actionIds = taskActionIds[contractName].actionIds;
    if (actionIds[signature] === undefined)
      throw new Error(`Could not find function ${contractName}.${signature} on task ${this.id}`);
    return actionIds[signature];
  }

  rawInput(): RawInputKeyValue {
    return this._getDefaultExportForNetwork('input.ts');
  }

  input(): Input {
    return this._parseRawInput(this.rawInput());
  }

  output({ ensure = true, network }: { ensure?: boolean; network?: Network } = {}): Output {
    if (network === undefined) {
      network = this.mode !== TaskMode.TEST ? this.network : 'test';
    }

    const taskOutputDir = this._dirAt(this.dir(), 'output', ensure);
    const taskOutputFile = this._fileAt(taskOutputDir, `${network}.json`, ensure);
    return this._read(taskOutputFile);
  }

  settings(): RawInputKeyValue {
    return this._getDefaultExportForNetwork('settings.ts');
  }

  hasOutput(): boolean {
    let taskHasOutput = true;
    try {
      this.output();
    } catch {
      taskHasOutput = false;
    }

    return taskHasOutput;
  }

  save(rawOutput: RawOutput): void {
    const output = this._parseRawOutput(rawOutput);

    if (this.mode === TaskMode.CHECK) {
      // `save` is only called by `deploy` (which only happens in LIVE and TEST modes), or manually for contracts that
      // are deployed by other contracts (e.g. Batch Relayer Entrypoints). Therefore, by testing for CHECK mode we can
      // identify this second type of contracts, and check them by comparing the saved address to the address that the
      // task would attempt to save.
      this._checkManuallySavedArtifacts(output);
    } else if (this.mode === TaskMode.LIVE || this.mode === TaskMode.TEST) {
      this._save(output);
    }
  }

  getStatus(): TaskStatus {
    const taskDirectory = this.dir();
    const __taskStatus = (versionRoot: string): TaskStatus | undefined => {
      if (taskDirectory === path.join(getTasksDir(versionRoot), this.id)) {
        return TaskStatus.ACTIVE;
      } else if (taskDirectory === path.join(getDeprecatedDir(versionRoot), this.id)) {
        return TaskStatus.DEPRECATED;
      } else if (taskDirectory === path.join(getScriptsDir(versionRoot), this.id)) {
        return TaskStatus.SCRIPT;
      } else {
        return undefined;
      }
    };

    for (const versionRoot of VERSION_ROOTS) {
      const taskStatus = __taskStatus(versionRoot);
      if (taskStatus !== undefined) {
        return taskStatus;
      }
    }

    throw new Error('Unknown task status');
  }

  private _getDefaultExportForNetwork(script: string): RawInputKeyValue {
    const taskInputPath = this._fileAt(this.dir(), script);
    const rawInput = require(taskInputPath).default;
    const globalInput = { ...rawInput };
    NETWORKS.forEach((network) => delete globalInput[network]);
    const networkInput = rawInput[this.network] || {};
    return { ...globalInput, ...networkInput };
  }

  private _checkManuallySavedArtifacts(output: Output) {
    for (const name of Object.keys(output)) {
      const expectedAddress = this.output()[name];
      const actualAddress = output[name];
      if (actualAddress === expectedAddress) {
        logger.success(`Verified contract '${name}' on network '${this.network}' of task '${this.id}'`);
      } else {
        throw Error(
          `The stated deployment address of '${name}' on network '${this.network}' of task '${this.id}' (${actualAddress}) does not match the expected address (${expectedAddress})`
        );
      }
    }
  }

  private _save(output: Output) {
    const taskOutputDir = this._dirAt(this.dir(), 'output', false);
    if (!fs.existsSync(taskOutputDir)) fs.mkdirSync(taskOutputDir);

    const outputFile = this.mode === TaskMode.LIVE ? `${this.network}.json` : 'test.json';
    const taskOutputFile = this._fileAt(taskOutputDir, outputFile, false);
    const previousOutput = this._read(taskOutputFile);

    const finalOutput = { ...previousOutput, ...output };
    this._write(taskOutputFile, finalOutput);
  }

  private _parseRawInput(rawInput: RawInputKeyValue): Input {
    return Object.keys(rawInput).reduce((input: Input, key: Network | string) => {
      const item = rawInput[key];

      if (!this._isTask(item)) {
        // Non-task inputs are simply their value
        input[key] = item;
      } else {
        // For task inputs, we query the output file with the name of the key in the input object. For example, given
        // { 'BalancerHelpers': new Task('20210418-vault', TaskMode.READ_ONLY) }
        // the input value will be the output of name 'BalancerHelpers' of said task.
        const task = item as Task;
        const output = task.output({ network: this.network });

        if (output[key] === undefined) {
          throw Error(`No '${key}' value for task ${task.id} in output of network ${this.network}`);
        }

        input[key] = output[key];
      }

      return input;
    }, {});
  }

  private _parseRawOutput(rawOutput: RawOutput): Output {
    return Object.keys(rawOutput).reduce((output: Output, key: string) => {
      const value = rawOutput[key];
      output[key] = typeof value === 'string' ? value : value.address;
      return output;
    }, {});
  }

  private _read(path: string): Output {
    return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path).toString()) : {};
  }

  private _write(path: string, output: Output): void {
    const finalOutputJSON = JSON.stringify(output, null, 2);
    fs.writeFileSync(path, finalOutputJSON);
  }

  private _fileAt(base: string, name: string, ensure = true): string {
    const filePath = path.join(base, name);
    if (ensure && !this._existsFile(filePath)) throw Error(`Could not find a file at ${filePath}`);
    return filePath;
  }

  private _dirAt(base: string, name: string, ensure = true): string {
    const dirPath = path.join(base, name);
    if (ensure && !this._existsDir(dirPath)) throw Error(`Could not find a directory at ${dirPath}`);
    return dirPath;
  }

  private _existsFile(filePath: string): boolean {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  }

  private _existsDir(dirPath: string): boolean {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _isTask(object: any): boolean {
    return object.constructor.name == 'Task';
  }

  private _findTaskId(idAlias: string): string {
    const matches = Task.getAllTaskIds().filter((taskDirName) => taskDirName.includes(idAlias));

    if (matches.length == 1) {
      return matches[0];
    } else {
      if (matches.length == 0) {
        throw Error(`Found no matching directory for task alias '${idAlias}'`);
      } else {
        throw Error(
          `Multiple matching directories for task alias '${idAlias}', candidates are: \n${matches.join('\n')}`
        );
      }
    }
  }

  /**
   * Return all directories inside the top 3 fixed task directories in a flat, sorted array.
   */
  static getAllTaskIds(): string[] {
    const __versionTaskIds = (versionRoot: string): string[] => {
      // Some operating systems may insert hidden files that should not be listed, so we just look for directories when
      // reading the file system.
      return [getTasksDir(versionRoot), getDeprecatedDir(versionRoot), getScriptsDir(versionRoot)]
        .map((dir) => fs.readdirSync(dir).filter((fileName) => fs.lstatSync(path.resolve(dir, fileName)).isDirectory()))
        .flat()
        .sort();
    };

    let taskIds: string[] = [];
    for (const versionRoot of VERSION_ROOTS) {
      taskIds = taskIds.concat(__versionTaskIds(versionRoot));
    }

    return taskIds;
  }
}
