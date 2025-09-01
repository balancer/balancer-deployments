import { fp } from '@helpers/numbers';
import { Task, TaskMode } from '@src';

export type ProtocolFeeControllerDeployment = {
  Vault: string;
  InitialGlobalProtocolSwapFee: bigint;
  InitialGlobalProtocolYieldFee: bigint;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);

const initialGlobalProtocolSwapFee = fp(0.5);
const initialGlobalProtocolYieldFee = fp(0.1);

export default {
  Vault,
  InitialGlobalProtocolSwapFee: initialGlobalProtocolSwapFee,
  InitialGlobalProtocolYieldFee: initialGlobalProtocolYieldFee,
};
