import { bn, fp } from '@helpers/numbers';
import { Task, TaskMode } from '@src';
import { BigNumber } from 'ethers';

export type MevCaptureHookDeployment = {
  Vault: string;
  BalancerContractRegistry: string;
  DefaultMevTaxMultiplier: BigNumber;
  DefaultMevTaxThreshold: BigNumber;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const BalancerContractRegistry = new Task('20250117-v3-contract-registry', TaskMode.READ_ONLY);
const DefaultMevTaxMultiplier = fp(1.5e6);
const DefaultMevTaxThreshold = bn(0.3e9); // 0.3 GWEI

export default {
  Vault,
  BalancerContractRegistry,
  DefaultMevTaxMultiplier,
  DefaultMevTaxThreshold,
};
