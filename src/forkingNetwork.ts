import fs from 'fs';
import os from 'os';
import path from 'path';

type LocalNetworksConfig = {
  networks?: Record<string, { url?: string }>;
};

const LOCAL_NETWORKS_CONFIG_PATH = path.join(os.homedir(), '.hardhat', 'networks.json');
const FALLBACK_RPC_URLS: Record<string, string[]> = {
  mainnet: ['https://ethereum-rpc.publicnode.com', 'https://eth.llamarpc.com'],
  arbitrum: ['https://arbitrum-one-rpc.publicnode.com', 'https://arb1.arbitrum.io/rpc'],
  optimism: ['https://optimism-rpc.publicnode.com', 'https://mainnet.optimism.io'],
  polygon: ['https://polygon-bor-rpc.publicnode.com', 'https://rpc-mainnet.matic.network'],
  gnosis: ['https://gnosis-rpc.publicnode.com', 'https://rpc.gnosischain.com'],
  avalanche: ['https://avalanche-c-chain-rpc.publicnode.com', 'https://api.avax.network/ext/bc/C/rpc'],
  zkevm: ['https://zkevm-rpc.com'],
  base: ['https://base-rpc.publicnode.com', 'https://mainnet.base.org'],
};
const ENABLE_PUBLIC_RPC_FALLBACKS = process.env.HARDHAT_ENABLE_PUBLIC_RPC_FALLBACKS === 'true';

function readLocalNetworksConfig(): LocalNetworksConfig {
  if (!fs.existsSync(LOCAL_NETWORKS_CONFIG_PATH)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(LOCAL_NETWORKS_CONFIG_PATH, 'utf8')) as LocalNetworksConfig;
  } catch {
    return {};
  }
}

function environmentVariableCandidates(network: string): string[] {
  const normalized = network.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  return [
    `${normalized}_RPC_URL`,
    `${normalized}_URL`,
    `RPC_URL_${normalized}`,
    `URL_${normalized}`,
  ];
}

function isUsableRpcUrl(url: string | undefined): url is string {
  if (url === undefined || url.length === 0) {
    return false;
  }

  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.endsWith('rpc.endpoint')) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

function parseRpcCandidates(value: string | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  return value
    .split(',')
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate.length > 0);
}

function isInfuraUrl(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().includes('infura.io');
  } catch {
    return false;
  }
}

export function getRpcUrlsForNetwork(network: string): string[] {
  const candidates: string[] = [];

  for (const variable of environmentVariableCandidates(network)) {
    const values = parseRpcCandidates(process.env[variable]);
    for (const value of values) {
      if (isUsableRpcUrl(value)) {
        candidates.push(value);
      }
    }
  }

  const localNetworks = readLocalNetworksConfig();
  const localUrl = localNetworks.networks?.[network]?.url;
  if (isUsableRpcUrl(localUrl)) {
    candidates.push(localUrl);
  }

  if (ENABLE_PUBLIC_RPC_FALLBACKS) {
    for (const fallbackUrl of FALLBACK_RPC_URLS[network] ?? []) {
      if (isUsableRpcUrl(fallbackUrl)) {
        candidates.push(fallbackUrl);
      }
    }
  }

  if (candidates.length === 0) {
    return [];
  }

  const uniqueCandidates = [...new Set(candidates)];
  const nonInfuraCandidates = uniqueCandidates.filter((candidate) => !isInfuraUrl(candidate));
  const infuraCandidates = uniqueCandidates.filter((candidate) => isInfuraUrl(candidate));
  const orderedCandidates = nonInfuraCandidates.length > 0 ? [...nonInfuraCandidates, ...infuraCandidates] : uniqueCandidates;

  return orderedCandidates;
}

export function getRpcUrlForNetwork(network: string): string | undefined {
  return getRpcUrlsForNetwork(network)[0];
}
