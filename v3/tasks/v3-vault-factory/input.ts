import { Task, TaskMode } from '@src';
import { MONTH } from '@helpers/time';

export type VaultDeployment = {
  Authorizer: string;
  pauseWindowDuration: number;
  bufferPeriodDuration: number;
  minTradeAmount: number;
  minWrapAmount: number;
  vaultCreationCode: string;
  vaultExtensionCreationCode: string;
  vaultAdminCreationCode: string;
  salt: string;
  expectedVaultAddress: string;
};

const Authorizer = new Task('20210418-authorizer', TaskMode.READ_ONLY);
const Vault = new Task('v3-vault-factory', TaskMode.READ_ONLY);

const vaultArtifact = Vault.artifact('Vault');
const vaultCreationCode = vaultArtifact.bytecode;

// console.log(vaultCreationCode);

const vaultExtensionArtifact = Vault.artifact('VaultExtension');
const vaultExtensionCreationCode = vaultExtensionArtifact.bytecode;

const vaultAdminArtifact = Vault.artifact('VaultAdmin');
const vaultAdminCreationCode = vaultAdminArtifact.bytecode;

const salt = '0x000000000000000000000000000000000000000000000000000000000000BEEF';

export default {
  Authorizer,
  pauseWindowDuration: 3 * MONTH * 12,
  bufferPeriodDuration: MONTH,
  minTradeAmount: 1e6,
  minWrapAmount: 1e4,
  vaultCreationCode,
  vaultExtensionCreationCode,
  vaultAdminCreationCode,
  salt,
};
