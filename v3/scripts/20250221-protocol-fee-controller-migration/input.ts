import { Task, TaskMode } from '@src';

export type ProtocolFeeControllerMigrationDeployment = {
  Vault: string;
  ProtocolFeeController: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const ProtocolFeeController = new Task('20250214-v3-protocol-fee-controller-v2', TaskMode.READ_ONLY);

export default {
  Vault,
  ProtocolFeeController,
};
