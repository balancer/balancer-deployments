import { Task, TaskMode } from '@src';

export type ProtocolFeeSweeperDeployment = {
  Vault: string;
  FeeRecipient: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
// See https://github.com/BalancerMaxis/bal_addresses/blob/main/outputs/addressbook.json#L268
const FeeRecipient = '0x9ff471F9f98F42E5151C7855fD1b5aa906b1AF7e';

export default {
  Vault,
  FeeRecipient,
};
