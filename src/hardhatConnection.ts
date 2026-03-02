import type { HardhatEthers } from '@nomicfoundation/hardhat-ethers/types';
import type { NetworkHelpers } from '@nomicfoundation/hardhat-network-helpers/types';
import type { ChainType, NetworkConnection } from 'hardhat/types/network';

type AnyNetworkConnection = NetworkConnection<ChainType | string> & {
  ethers: HardhatEthers;
  networkHelpers: NetworkHelpers;
};

type ForkConfig = {
  rpcUrls: string[];
  blockNumber: number;
};

type LegacyNetworkBridge = {
  provider?: AnyNetworkConnection['provider'];
  name?: string;
  config?: AnyNetworkConnection['networkConfig'];
};

type LegacyHreBridge = {
  network: {
    connect: (
      params?: { override?: { forking?: { enabled: boolean; url: string; blockNumber: number } } } | string
    ) => Promise<AnyNetworkConnection>;
  } & LegacyNetworkBridge;
  ethers?: HardhatEthers;
  provider?: AnyNetworkConnection['provider'];
};

const FORK_CONNECT_TIMEOUT_MS = Number(process.env.HARDHAT_FORK_CONNECT_TIMEOUT_MS ?? 45000);
const DISABLE_RPC_PREFLIGHT = process.env.HARDHAT_DISABLE_RPC_PREFLIGHT === 'true';

let activeConnection: AnyNetworkConnection | undefined;
let activeConnectionKey: string | undefined;
let hrePromise: Promise<LegacyHreBridge> | undefined;
let activeForkSnapshotId: string | undefined;
let activeForkSnapshotKey: string | undefined;

async function getHre(): Promise<LegacyHreBridge> {
  if (hrePromise === undefined) {
    hrePromise = import('hardhat').then((module) => ((module.default ?? module) as unknown as LegacyHreBridge));
  }

  return hrePromise;
}

export function applyEthersCompatibilityBridge(ethers: HardhatEthers): void {
  type EthersCompatibility = HardhatEthers & {
    utils?: {
      Interface: HardhatEthers['Interface'];
      defaultAbiCoder: {
        encode: (types: readonly string[], values: readonly unknown[]) => string;
        decode: (types: readonly string[], data: string) => unknown;
      };
      arrayify: HardhatEthers['getBytes'];
      concat: HardhatEthers['concat'];
      hexValue: (value: unknown) => string;
      hexlify: HardhatEthers['hexlify'];
      hexZeroPad: (value: string, length: number) => string;
      keccak256: HardhatEthers['keccak256'];
      parseEther: HardhatEthers['parseEther'];
      randomBytes: HardhatEthers['randomBytes'];
      solidityKeccak256: HardhatEthers['solidityPackedKeccak256'];
      toUtf8Bytes: HardhatEthers['toUtf8Bytes'];
    };
    constants?: {
      AddressZero: string;
      HashZero: string;
    };
    ZeroAddress: string;
    ZeroHash: string;
    toBeHex: (value: bigint | number) => string;
    Contract?: { prototype?: object };
    BaseContract?: { prototype?: object };
    Interface?: { prototype?: object };
    TransactionReceipt?: { prototype?: object };
    ContractTransactionReceipt?: { prototype?: object };
  };

  const compatibleEthers = ethers as EthersCompatibility;
  if (compatibleEthers.utils === undefined) {
    compatibleEthers.utils = {
      Interface: compatibleEthers.Interface,
      defaultAbiCoder: compatibleEthers.AbiCoder.defaultAbiCoder(),
      arrayify: compatibleEthers.getBytes,
      concat: compatibleEthers.concat,
      hexValue: (value: unknown): string => {
        if (typeof value === 'bigint' || typeof value === 'number') {
          return compatibleEthers.toBeHex(value);
        }
        return compatibleEthers.hexlify(value as Parameters<HardhatEthers['hexlify']>[0]);
      },
      hexlify: compatibleEthers.hexlify,
      hexZeroPad: compatibleEthers.zeroPadValue,
      keccak256: compatibleEthers.keccak256,
      parseEther: compatibleEthers.parseEther,
      randomBytes: compatibleEthers.randomBytes,
      solidityKeccak256: compatibleEthers.solidityPackedKeccak256,
      toUtf8Bytes: compatibleEthers.toUtf8Bytes,
    };
  }

  if (compatibleEthers.constants === undefined) {
    compatibleEthers.constants = {
      AddressZero: compatibleEthers.ZeroAddress,
      HashZero: compatibleEthers.ZeroHash,
    };
  }

  const interfacePrototype = compatibleEthers.Interface?.prototype;
  if (interfacePrototype !== undefined && Object.getOwnPropertyDescriptor(interfacePrototype, 'getSighash') === undefined) {
    Object.defineProperty(interfacePrototype, 'getSighash', {
      configurable: true,
      value(fragment: string): string {
        return (this as { getFunction: (name: string) => { selector: string } }).getFunction(fragment).selector;
      },
    });
  }

  for (const contractPrototype of [compatibleEthers.BaseContract?.prototype, compatibleEthers.Contract?.prototype]) {
    if (contractPrototype === undefined) {
      continue;
    }

    if (Object.getOwnPropertyDescriptor(contractPrototype, 'address') === undefined) {
      Object.defineProperty(contractPrototype, 'address', {
        configurable: true,
        get() {
          return (this as { target?: string }).target;
        },
      });
    }

    if (Object.getOwnPropertyDescriptor(contractPrototype, 'provider') === undefined) {
      Object.defineProperty(contractPrototype, 'provider', {
        configurable: true,
        get() {
          return (this as { runner?: { provider?: unknown } }).runner?.provider;
        },
      });
    }

    if (Object.getOwnPropertyDescriptor(contractPrototype, 'deployTransaction') === undefined) {
      Object.defineProperty(contractPrototype, 'deployTransaction', {
        configurable: true,
        get() {
          const deploymentTransaction = (this as { deploymentTransaction?: () => unknown }).deploymentTransaction;
          return typeof deploymentTransaction === 'function' ? deploymentTransaction.call(this) : undefined;
        },
      });
    }
  }

  for (const receiptPrototype of [
    compatibleEthers.TransactionReceipt?.prototype,
    compatibleEthers.ContractTransactionReceipt?.prototype,
  ]) {
    if (receiptPrototype === undefined) {
      continue;
    }

    if (Object.getOwnPropertyDescriptor(receiptPrototype, 'transactionHash') === undefined) {
      Object.defineProperty(receiptPrototype, 'transactionHash', {
        configurable: true,
        get() {
          return (this as { hash?: string }).hash;
        },
      });
    }

    if (Object.getOwnPropertyDescriptor(receiptPrototype, 'events') === undefined) {
      Object.defineProperty(receiptPrototype, 'events', {
        configurable: true,
        get() {
          const logs = (this as { logs?: Array<Record<string, unknown>> }).logs;
          if (!Array.isArray(logs)) {
            return undefined;
          }

          return logs
            .map((log) => {
              const event =
                (log.event as string | undefined) ??
                (log.eventName as string | undefined) ??
                ((log.fragment as { name?: string } | undefined)?.name as string | undefined);
              if (event === undefined) {
                return undefined;
              }

              return {
                ...log,
                event,
                args: log.args,
              };
            })
            .filter((event) => event !== undefined) as Array<{ event: string; args?: unknown }>;
        },
      });
    }
  }
}

function getConnectionKey(forkConfig?: ForkConfig): string {
  return forkConfig === undefined ? 'default' : `${forkConfig.blockNumber}@${forkConfig.rpcUrls.join(',')}`;
}

async function requestRpc(
  connection: AnyNetworkConnection,
  method: string,
  params: unknown[] = []
): Promise<unknown> {
  return connection.provider.request({
    method,
    params,
  });
}

async function takeSnapshot(connection: AnyNetworkConnection): Promise<string> {
  const snapshotId = await requestRpc(connection, 'evm_snapshot');
  if (typeof snapshotId !== 'string' && typeof snapshotId !== 'number') {
    throw Error(`Unexpected snapshot id type: ${typeof snapshotId}`);
  }

  return String(snapshotId);
}

async function resetForkSnapshot(connection: AnyNetworkConnection, key: string): Promise<void> {
  if (activeForkSnapshotId !== undefined && activeForkSnapshotKey === key) {
    const reverted = await requestRpc(connection, 'evm_revert', [activeForkSnapshotId]);
    if (reverted !== true) {
      throw Error(`Could not revert fork snapshot for ${key}`);
    }
  }

  activeForkSnapshotId = await takeSnapshot(connection);
  activeForkSnapshotKey = key;
}

async function applyLegacyBridge(connection: AnyNetworkConnection): Promise<void> {
  applyEthersCompatibilityBridge(connection.ethers);

  const bridgedHre = await getHre();
  bridgedHre.ethers = connection.ethers;
  bridgedHre.provider = connection.provider;
  bridgedHre.network.provider = connection.provider;
  bridgedHre.network.name = connection.networkName;
  bridgedHre.network.config = connection.networkConfig;
}

async function createConnection(forkConfig?: ForkConfig): Promise<AnyNetworkConnection> {
  const hre = await getHre();
  if (forkConfig === undefined) {
    return (await hre.network.connect()) as AnyNetworkConnection;
  }

  let lastError: unknown = new Error(
    `No usable RPC endpoints for fork at block ${forkConfig.blockNumber}. Checked: ${forkConfig.rpcUrls.join(', ')}`
  );
  const preflightFailedUrls: string[] = [];

  for (const rpcUrl of forkConfig.rpcUrls) {
    const preflightOk = DISABLE_RPC_PREFLIGHT ? true : await isRpcUrlReachable(rpcUrl);
    if (!preflightOk) {
      preflightFailedUrls.push(rpcUrl);
      lastError = new Error(`RPC preflight failed for ${rpcUrl}`);
      continue;
    }

    try {
      return await connectForkWithTimeout(hre, rpcUrl, forkConfig.blockNumber);
    } catch (error) {
      lastError = error;
    }
  }

  // If preflight failed for all candidates, still try connecting directly with timeout:
  // some providers reject lightweight probes but work for Hardhat forking calls.
  for (const rpcUrl of preflightFailedUrls) {
    try {
      return await connectForkWithTimeout(hre, rpcUrl, forkConfig.blockNumber);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function connectForkWithTimeout(hre: LegacyHreBridge, rpcUrl: string, blockNumber: number): Promise<AnyNetworkConnection> {
  return await withTimeout(
    hre.network.connect({
      override: {
        forking: {
          enabled: true,
          url: rpcUrl,
          blockNumber,
        },
      },
    }) as Promise<AnyNetworkConnection>,
    FORK_CONNECT_TIMEOUT_MS,
    new Error(`RPC connect timed out for ${rpcUrl}`)
  );
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutError: Error): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(timeoutError), timeoutMs);
    promise
      .then((result) => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

async function isRpcUrlReachable(rpcUrl: string): Promise<boolean> {
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), 4000);

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as { result?: unknown; error?: unknown };
    return payload.error === undefined && payload.result !== undefined;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function setActiveConnection(nextConnection: AnyNetworkConnection, key: string): Promise<AnyNetworkConnection> {
  const previousConnection = activeConnection;
  activeConnection = nextConnection;
  activeConnectionKey = key;
  await applyLegacyBridge(nextConnection);

  if (previousConnection !== undefined && previousConnection.id !== nextConnection.id) {
    await previousConnection.close();
  }

  return nextConnection;
}

async function ensureConnection(forkConfig?: ForkConfig): Promise<AnyNetworkConnection> {
  if (forkConfig === undefined && activeConnection !== undefined) {
    await applyLegacyBridge(activeConnection);
    return activeConnection;
  }

  const key = getConnectionKey(forkConfig);
  if (activeConnection !== undefined && activeConnectionKey === key) {
    if (forkConfig !== undefined) {
      await resetForkSnapshot(activeConnection, key);
    }

    await applyLegacyBridge(activeConnection);
    return activeConnection;
  }

  const connection = await createConnection(forkConfig);
  const nextConnection = await setActiveConnection(connection, key);

  if (forkConfig !== undefined) {
    await resetForkSnapshot(nextConnection, key);
  } else {
    activeForkSnapshotId = undefined;
    activeForkSnapshotKey = undefined;
  }

  return nextConnection;
}

export async function getHardhatConnection(): Promise<AnyNetworkConnection> {
  return ensureConnection();
}

export async function useForkConnection(rpcUrls: string[], blockNumber: number): Promise<AnyNetworkConnection> {
  return ensureConnection({ rpcUrls, blockNumber });
}

export async function getHardhatEthers(): Promise<HardhatEthers> {
  return (await getHardhatConnection()).ethers;
}

export function getCachedHardhatEthers(): HardhatEthers | undefined {
  return activeConnection?.ethers;
}
