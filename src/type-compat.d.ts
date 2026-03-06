declare module '@nomicfoundation/hardhat-ethers/types' {
  export interface HardhatEthersSigner {
    address: string;
    getAddress(): Promise<string>;
    sendTransaction(tx: Record<string, unknown>): Promise<{ wait(): Promise<Record<string, unknown>> }>;
    [key: string]: any;
  }

  export interface HardhatEthers {
    provider: any;
    utils: any;
    constants: any;
    Interface: any;
    AbiCoder: any;
    getBytes: any;
    concat: any;
    hexlify: any;
    zeroPadValue: any;
    keccak256: any;
    parseEther: any;
    randomBytes: any;
    solidityPackedKeccak256: any;
    toUtf8Bytes: any;
    toBeHex: any;
    ZeroAddress: string;
    ZeroHash: string;
    getSigners(): Promise<HardhatEthersSigner[]>;
    getSigner(address?: string | number): Promise<HardhatEthersSigner>;
    getContractAt(abi: unknown, address: string): Promise<any>;
    getContractFactory(nameOrAbi: unknown, bytecodeOrSigner?: unknown, signer?: unknown): Promise<any>;
    getContractFactoryFromArtifact(artifact: unknown, options?: unknown): Promise<any>;
    [key: string]: any;
  }
}

declare module '@nomicfoundation/hardhat-network-helpers/types' {
  export interface SnapshotRestorer {
    restore(): Promise<void>;
  }

  export interface NetworkHelpers {
    loadFixture<T>(fixture: () => Promise<T>): Promise<T>;
    [key: string]: unknown;
  }
}

declare module 'hardhat/types/hre' {
  export type HardhatRuntimeEnvironment = any;
}

declare module 'hardhat/types/network' {
  export type ChainType = string;

  export interface NetworkConnection<TChainType extends ChainType = ChainType> {
    id: string | number;
    chainType?: TChainType;
    networkName: string;
    networkConfig: any;
    provider: {
      request(args: { method: string; params?: unknown[] }): Promise<unknown>;
    };
    close(): Promise<void>;
    [key: string]: any;
  }
}

declare module 'hardhat/types/artifacts' {
  export interface Artifact {
    _format?: string;
    contractName: string;
    sourceName: string;
    abi: any[];
    bytecode: string;
    deployedBytecode: string;
    linkReferences: Record<string, unknown>;
    deployedLinkReferences: Record<string, unknown>;
  }

  export interface BuildInfo {
    id: string;
    solcVersion: string;
    input: any;
    output: any;
  }
}

declare module 'hardhat/types/solidity/compiler-io' {
  export type CompilerOutputContract = any;
}

declare module 'hardhat/types' {
  export interface BuildInfo {
    id: string;
    solcVersion: string;
    input: any;
    output: any;
  }

  export interface CompilerInput {
    settings: {
      libraries?: Record<string, Record<string, string>>;
      [key: string]: unknown;
    };
    sources: Record<string, { content: string }>;
    [key: string]: unknown;
  }

  export type Libraries = Record<string, string>;

  export interface Network {
    name: string;
    provider: any;
    [key: string]: any;
  }

  export type Artifact = import('hardhat/types/artifacts').Artifact;

  export interface HardhatRuntimeEnvironment {
    [key: string]: any;
  }
}

declare module 'hardhat/config' {
  type TaskBuilder = {
    addParam(name: string, description?: string): TaskBuilder;
    addOptionalParam(name: string, description?: string): TaskBuilder;
    addPositionalParam(name: string, description?: string): TaskBuilder;
    addFlag(name: string, description?: string): TaskBuilder;
    setAction(action: (...args: any[]) => any): TaskBuilder;
  };

  export function task(name: string, description?: string): TaskBuilder;
}

declare module '@nomicfoundation/hardhat-ethers' {
  const plugin: unknown;
  export default plugin;
}

declare module '@nomicfoundation/hardhat-network-helpers' {
  const plugin: unknown;
  export default plugin;
}

declare module '@nomicfoundation/hardhat-mocha' {
  const plugin: unknown;
  export default plugin;
}

declare module '@nomicfoundation/hardhat-verify/etherscan' {
  export class Etherscan {
    static fromChainConfig(apiKey: string | undefined, chainConfig: Record<string, unknown>): Etherscan;
    constructor(apiKey: string, browserUrl: string, apiUrl: string);
    verify(
      address: string,
      sourceCode: string,
      contractName: string,
      compilerVersion: string,
      constructorArguments: string
    ): Promise<unknown>;
    getVerificationStatus(guid: string): Promise<{
      isSuccess(): boolean;
      isFailure(): boolean;
      isBytecodeMissingInNetworkError(): boolean;
      message: string;
    }>;
    getContractUrl(address: string): string;
  }
}

declare module '@nomicfoundation/hardhat-verify/internal/utilities' {
  export function getLongVersion(solcVersion: string): Promise<string>;
  export function encodeArguments(
    abi: unknown,
    sourceName: string,
    contractName: string,
    args: any[]
  ): Promise<string>;
  export function sleep(ms: number): Promise<void>;
}

declare module '@nomicfoundation/hardhat-verify/internal/solc/artifacts' {
  export function extractMatchingContractInformation(...args: any[]): Promise<any>;
  export function getLibraryInformation(
    contractInformation: any,
    libraries: Record<string, string>
  ): Promise<{ libraries: Record<string, Record<string, string>> }>;
}

declare module '@nomicfoundation/hardhat-verify/internal/solc/bytecode' {
  export class Bytecode {
    static getDeployedContractBytecode(address: string, provider: unknown, networkName: string): Promise<string>;
  }

  export function bytecodeMatchesDeployedBytecode(
    deployedBytecode: string,
    runtimeBytecode: string,
    libraries: Record<string, string>
  ): Promise<boolean>;
}

declare module '@nomicfoundation/hardhat-verify/types' {
  export type ApiKey = string;
  export type ChainConfig = {
    apiURL?: string;
    browserURL?: string;
    [key: string]: unknown;
  };

  export interface VerificationResponse {
    isSuccess(): boolean;
    message: string;
  }
}

declare module 'ethers/lib/utils' {
  export { Interface } from 'ethers';
}

declare module 'ethers' {
  export type BigNumberish = any;

  export class Interface {
    constructor(fragments: any);
    encodeFunctionData(fragment: string, values?: any[]): string;
    encodeDeploy(values?: any[]): string;
    parseLog(log: any): LogDescription;
    static getSighash(fragment: any): string;
    [key: string]: any;
  }

  export type LogDescription = {
    name: string;
    args: any;
    [key: string]: any;
  };

  export class Contract {
    address: string;
    target?: string;
    interface: Interface;
    deployTransaction?: any;
    connect(runner: any): Contract;
    attach(target: string): Contract;
    [key: string]: any;
  }

  export class Wallet {
    address: string;
    static createRandom(): Wallet;
    [key: string]: any;
  }

  export const TypedDataEncoder: any;
  export const ethers: any;
  export function getBytes(value: any): Uint8Array;
  export function randomBytes(length: number): Uint8Array;
  export function id(value: string): string;

  interface BaseContract {
    address: string;
    provider: unknown;
    signer: unknown;
    functions: Record<string, unknown>;
    callStatic: Record<string, (...args: unknown[]) => Promise<unknown>>;
    populateTransaction: Record<string, (...args: unknown[]) => Promise<unknown>>;
    estimateGas: Record<string, (...args: unknown[]) => Promise<unknown>>;
    [key: string]: any;
  }

  interface TransactionReceipt {
    transactionHash?: string;
    events?: Array<{ event?: string; args?: unknown }>;
  }

  interface ContractTransactionReceipt {
    transactionHash?: string;
    events?: Array<{ event?: string; args?: unknown }>;
    logs?: Array<Record<string, unknown>>;
  }

  namespace providers {
    type Provider = unknown;
    type TransactionRequest = Record<string, unknown>;
  }

  type ContractReceipt = ContractTransactionReceipt;
  type ContractTransaction = ContractTransactionResponse;
  type PopulatedTransaction = Record<string, unknown>;
  type BigNumber = bigint;
}
