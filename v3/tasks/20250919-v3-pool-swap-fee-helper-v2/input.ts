import { Task, TaskMode } from '@src';

export type PoolSwapFeeHelperDeployment = {
  Vault: string;
  HelperAdmin: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);

// See https://github.com/BalancerMaxis/bal_addresses/blob/main/outputs/addressbook.json#L268
const MaxiOmniMultisig = '0x9ff471F9f98F42E5151C7855fD1b5aa906b1AF7e';
const SepoliaAdmin = '0x9098b50ee2d9E4c3C69928A691DA3b192b4C9673';
const SonicAdmin = '0x97079F7E04B535FE7cD3f972Ce558412dFb33946';

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
  sonic: {
    HelperAdmin: SonicAdmin,
  },
};
