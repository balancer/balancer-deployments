import { fp } from '@helpers/numbers';
import { Task, TaskMode } from '@src';

export type ProtocolFeePercentagesProviderDeployment = {
  Vault: string;
  maxYieldValue: bigint;
  maxAUMValue: bigint;
};

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);
const maxYieldValue = fp(0.5);
const maxAUMValue = fp(0.5);

export default {
  Vault,
  maxYieldValue,
  maxAUMValue,
};
