import { Task, TaskMode } from '@src';

export type TokenPairRegistryDeployment = {
  Vault: string;
  InitialOwner: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);

// https://github.com/BalancerMaxis/bal_addresses/blob/43e3e8b2fcfcb8be10553f136ce64cc9290496dc/extras/multisigs.json#L132
const InitialOwner = '0x9ff471F9f98F42E5151C7855fD1b5aa906b1AF7e';

export default {
  Vault,
  InitialOwner,
};
