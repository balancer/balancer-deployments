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
  targetVaultAddress: string;
};

const Authorizer = new Task('20210418-authorizer', TaskMode.READ_ONLY);
const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);

const vaultArtifact = Vault.artifact('Vault');
const vaultCreationCode = vaultArtifact.bytecode;

const vaultExtensionArtifact = Vault.artifact('VaultExtension');
const vaultExtensionCreationCode = vaultExtensionArtifact.bytecode;

const vaultAdminArtifact = Vault.artifact('VaultAdmin');
const vaultAdminCreationCode = vaultAdminArtifact.bytecode;

const salt = '0x3877188e9e5da25b11fdb7f5e8d4fdddce2d22707ba04878a8e14700dd46fa82';
const targetVaultAddress = '0xbA1333333333a1BA1108E8412f11850A5C319bA9';

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
};
