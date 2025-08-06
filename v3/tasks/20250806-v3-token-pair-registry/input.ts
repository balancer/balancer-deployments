import { Task, TaskMode } from '@src';

export type TokenPairRegistryDeployment = {
  Vault: string;
  InitialOwner: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);

// https://github.com/BalancerMaxis/bal_addresses/blob/4b7ab007d01af33f996ae22bc70184f4eca6deeb/extras/signers.json#L72
const InitialOwner = '0x74E283B985EA76c55C8B48d6bD1067a418188424';

export default {
  Vault,
  InitialOwner,
};
