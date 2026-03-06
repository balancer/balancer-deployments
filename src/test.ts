import { getRpcUrlsForNetwork } from './forkingNetwork';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

type RunSuperFunction = (args: any) => Promise<void>;
type HardhatNetworkConfig = { forking?: { url?: string } };

export default async function (args: any, hre: any, run: RunSuperFunction): Promise<void> {
  console.log('Running fork tests...');
  if (args.id) {
    args.testFiles = args.testFiles.filter((file: string) => file.includes(args.id));
  }
  await run(args);
}

export function getForkedNetwork(hre: any): string {
  if (process.env.HARDHAT_FORK_NETWORK) {
    return process.env.HARDHAT_FORK_NETWORK;
  }

  const legacyNetwork = hre.network as typeof hre.network & { config?: HardhatNetworkConfig; name?: string };
  const config = legacyNetwork.config;
  if (!config?.forking || !config.forking.url) {
    throw Error(`No forks found on network ${legacyNetwork.name ?? 'default'}`);
  }

  const network = Object.keys(hre.config.networks).find((networkName) => {
    return getRpcUrlsForNetwork(networkName).includes(config?.forking?.url ?? '');
  });

  if (!network) throw Error(`No network found matching fork from ${config.forking.url}`);
  return network;
}
