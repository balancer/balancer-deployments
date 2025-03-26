import { Task, TaskMode } from '@src';
import { MONTH } from '@helpers/time';
import { fp } from '@helpers/numbers';

export type VaultFactoryDeployment = {
  Authorizer: string;
  pauseWindowDuration: number;
  bufferPeriodDuration: number;
  minTradeAmount: number;
  minWrapAmount: number;
  vaultCreationCode: string;
  vaultExtensionCreationCode: string;
  vaultAdminCreationCode: string;
  salt: string;
  targetVaultAddress: string;
  InitialGlobalProtocolSwapFee: bigint;
  InitialGlobalProtocolYieldFee: bigint;
};

const Authorizer = new Task('20210418-authorizer', TaskMode.READ_ONLY);
const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);

const vaultArtifact = Vault.artifact('Vault');
const vaultCreationCode = vaultArtifact.bytecode;

const vaultExtensionArtifact = Vault.artifact('VaultExtension');
const vaultExtensionCreationCode = vaultExtensionArtifact.bytecode;

const vaultAdminArtifact = Vault.artifact('VaultAdmin');
const vaultAdminCreationCode = vaultAdminArtifact.bytecode;

const salt = '0xeb12e16955efe9c728b5cccf8cf188af4ae92f94cb0d78275d7d3c022087ffd4';
const targetVaultAddress = '0xba1333333333cbcdB5D83c2e5d1D898E07eD00Dc';

const initialGlobalProtocolSwapFee = fp(0.5); // 50%
const initialGlobalProtocolYieldFee = fp(0.1); // 10%

export default {
  Authorizer,
  pauseWindowDuration: 4 * MONTH * 12,
  bufferPeriodDuration: 6 * MONTH,
  minTradeAmount: 1e6,
  minWrapAmount: 1e4,
  vaultCreationCode,
  vaultExtensionCreationCode,
  vaultAdminCreationCode,
  salt,
  targetVaultAddress,
  InitialGlobalProtocolSwapFee: initialGlobalProtocolSwapFee,
  InitialGlobalProtocolYieldFee: initialGlobalProtocolYieldFee,
};
