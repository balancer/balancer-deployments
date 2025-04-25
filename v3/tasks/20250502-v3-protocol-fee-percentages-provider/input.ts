import { Task, TaskMode } from '@src';

export type ProtocolFeePercentagesProviderDeployment = {
  Vault: string;
  ProtocolFeeController: string;
  BalancerContractRegistry: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const ProtocolFeeController = new Task('20250214-v3-protocol-fee-controller-v2', TaskMode.READ_ONLY);
const BalancerContractRegistry = new Task('20250117-v3-contract-registry', TaskMode.READ_ONLY);

export default {
  Vault,
  ProtocolFeeController,
  BalancerContractRegistry,
};
