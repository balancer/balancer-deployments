import { Network } from './types';
import { getRpcUrlsForNetwork } from './forkingNetwork';
import { useForkConnection } from './hardhatConnection';

const FORK_TEST_TIMEOUT_MS = 10 * 60 * 1000;

export function describeForkTest(name: string, forkNetwork: Network, blockNumber: number, callback: () => void): void {
  describe(name, () => {
    _describeBody(forkNetwork, blockNumber, callback);
  });
}

describeForkTest.only = function (name: string, forkNetwork: Network, blockNumber: number, callback: () => void): void {
  // eslint-disable-next-line mocha-no-only/mocha-no-only
  describe.only(name, () => {
    _describeBody(forkNetwork, blockNumber, callback);
  });
};

describeForkTest.skip = function (name: string, forkNetwork: Network, blockNumber: number, callback: () => void): void {
  describe(name, () => {
    _describeBody(forkNetwork, blockNumber, callback);
  });
};

function _describeBody(forkNetwork: Network, blockNumber: number, callback: () => void) {
  before('setup fork test', async function () {
    this.timeout(FORK_TEST_TIMEOUT_MS);

    const rpcUrls = getRpcUrlsForNetwork(forkNetwork);
    if (rpcUrls.length === 0) {
      throw Error(
        `Could not find RPC URL for network ${forkNetwork}. Set ${forkNetwork.toUpperCase()}_RPC_URL or ~/.hardhat/networks.json`
      );
    }

    await useForkConnection(rpcUrls, blockNumber);

    process.env.HARDHAT_FORK_NETWORK = forkNetwork;
  });

  beforeEach('increase fork test timeout', function () {
    this.timeout(FORK_TEST_TIMEOUT_MS);
  });

  callback();
}
