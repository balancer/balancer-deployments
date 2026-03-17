import { Task, TaskMode } from '@src';

export type PoolSwapFeeHelperDeployment = {
  Vault: string;
  HelperAdmin: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);

// See https://github.com/balancer/bal_addresses/blob/cc26cd8c1d7c3c48c09f4d5d35704a0bbf00dd48/extras/multisigs.json#L10
const MaxiOmniMultisig = '0x9ff471F9f98F42E5151C7855fD1b5aa906b1AF7e';
const SepoliaAdmin = '0x9098b50ee2d9E4c3C69928A691DA3b192b4C9673';

export default {
  Vault,
  arbitrum: {
    HelperAdmin: MaxiOmniMultisig,
  },
  base: {
    HelperAdmin: MaxiOmniMultisig,
  },
  avalanche: {
    HelperAdmin: MaxiOmniMultisig,
  },
  optimism: {
    HelperAdmin: MaxiOmniMultisig,
  },
  gnosis: {
    HelperAdmin: MaxiOmniMultisig,
  },
  mainnet: {
    HelperAdmin: MaxiOmniMultisig,
  },
  hyperevm: {
    HelperAdmin: MaxiOmniMultisig,
  },
  plasma: {
    HelperAdmin: MaxiOmniMultisig,
  },
  xlayer: {
    HelperAdmin: MaxiOmniMultisig,
  },
  monad: {
    HelperAdmin: MaxiOmniMultisig,
  },
  sepolia: {
    HelperAdmin: SepoliaAdmin,
  },
};
