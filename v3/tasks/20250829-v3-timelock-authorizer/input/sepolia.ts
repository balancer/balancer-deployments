import { DAY, HOUR } from '@helpers/time';
import { Task, TaskMode } from '@src';
import { DelayData, RoleData } from './types';

export const TRANSITION_END_BLOCK = 4316000;

const network = 'sepolia';

// V3 contracts
const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY, network);
const ProtocolFeeController = new Task('20250214-v3-protocol-fee-controller-v2', network);
const BalancerContractRegistry = new Task('20250117-v3-contract-registry', TaskMode.READ_ONLY, network);
const ProtocolFeeSweeper = new Task('20250214-v3-protocol-fee-sweeper', TaskMode.READ_ONLY, network);
const ProtocolFeeSweeperV2 = new Task('20250503-v3-protocol-fee-sweeper-v2', TaskMode.READ_ONLY, network);
const PoolPauseHelper = new Task('20241024-v3-pool-pause-helper', TaskMode.READ_ONLY, network);
const PoolSwapFeeHelper = new Task('20241024-v3-pool-swap-fee-helper', TaskMode.READ_ONLY, network);

export const Root = '0x9098b50ee2d9E4c3C69928A691DA3b192b4C9673';

// Happens frequently
const SHORT_DELAY = 0.5 * HOUR;

// May happen frequently but can be dangerous
const MEDIUM_DELAY = 3 * HOUR;

// Happens basically never. A long grant delay typically involves replacing infrastructure (e.g. replacing the veBAL
// system or protocol fees).
const LONG_DELAY = DAY;

export const RootTransferDelay = LONG_DELAY;

export const GrantDelays: DelayData[] = [
  {
    actionId: ProtocolFeeController.actionId('ProtocolFeeController', 'withdrawProtocolFees(address,address)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: ProtocolFeeController.actionId(
      'ProtocolFeeController',
      'withdrawProtocolFeesForToken(address,address,address)'
    ),
    newDelay: MEDIUM_DELAY,
  },
];

export const getRoles: () => Promise<RoleData[]> = async () => [];

export const Granters: RoleData[] = [];

export const Revokers: RoleData[] = [];

export const ExecuteDelays: DelayData[] = [
  // setAuthorizer must be long since no delay can be longer than it.
  { actionId: Vault.actionId('VaultAdmin', 'setAuthorizer(address)'), newDelay: LONG_DELAY },
  { actionId: Vault.actionId('VaultAdmin', 'disableQueryPermanently()'), newDelay: LONG_DELAY },
  { actionId: Vault.actionId('VaultAdmin', 'enableQuery()'), newDelay: MEDIUM_DELAY },
  { actionId: Vault.actionId('VaultAdmin', 'disableRecoveryMode()'), newDelay: SHORT_DELAY },
  { actionId: Vault.actionId('VaultAdmin', 'setProtocolFeeController(address)'), newDelay: MEDIUM_DELAY },
  { actionId: Vault.actionId('VaultAdmin', 'setStaticSwapFeePercentage(address,uint256)'), newDelay: MEDIUM_DELAY },
  { actionId: Vault.actionId('VaultAdmin', 'unpausePool(address)'), newDelay: MEDIUM_DELAY },
  { actionId: Vault.actionId('VaultAdmin', 'unpauseVault()'), newDelay: MEDIUM_DELAY },
  { actionId: Vault.actionId('VaultAdmin', 'unpauseVaultBuffers()'), newDelay: MEDIUM_DELAY },

  {
    actionId: ProtocolFeeController.actionId('ProtocolFeeController', 'setGlobalProtocolSwapFeePercentage(uint256)'),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: ProtocolFeeController.actionId('ProtocolFeeController', 'setGlobalProtocolYieldFeePercentage(uint256)'),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: ProtocolFeeController.actionId('ProtocolFeeController', 'setProtocolSwapFeePercentage(address,uint256)'),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: ProtocolFeeController.actionId('ProtocolFeeController', 'setProtocolYieldFeePercentage(address,uint256)'),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: BalancerContractRegistry.actionId(
      'BalancerContractRegistry',
      'addOrUpdateBalancerContractAlias(string,address)'
    ),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: BalancerContractRegistry.actionId('BalancerContractRegistry', 'deprecateBalancerContract(address)'),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: BalancerContractRegistry.actionId('BalancerContractRegistry', 'deregisterBalancerContract(string)'),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: BalancerContractRegistry.actionId(
      'BalancerContractRegistry',
      'registerBalancerContract(uint8,string,address)'
    ),
    newDelay: SHORT_DELAY,
  },

  {
    actionId: ProtocolFeeSweeper.actionId('ProtocolFeeSweeper', 'addProtocolFeeBurner(address)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: ProtocolFeeSweeper.actionId('ProtocolFeeSweeper', 'setFeeRecipient(address)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: ProtocolFeeSweeper.actionId('ProtocolFeeSweeper', 'setTargetToken(address)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: ProtocolFeeSweeperV2.actionId('ProtocolFeeSweeper', 'addProtocolFeeBurner(address)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: ProtocolFeeSweeperV2.actionId('ProtocolFeeSweeper', 'setFeeRecipient(address)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: ProtocolFeeSweeperV2.actionId('ProtocolFeeSweeper', 'setTargetToken(address)'),
    newDelay: MEDIUM_DELAY,
  },

  {
    actionId: PoolPauseHelper.actionId('PoolPauseHelper', 'addPools(address[])'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: PoolSwapFeeHelper.actionId('PoolSwapFeeHelper', 'addPools(address[])'),
    newDelay: MEDIUM_DELAY,
  },
];

// Checks

const actionIds = [
  ExecuteDelays.map((delayData) => delayData.actionId),
  GrantDelays.map((delayData) => delayData.actionId),
].flat();

if (new Set(actionIds).size !== actionIds.length) {
  throw new Error('Duplicate action ID found in configuration');
}

const delays = [
  ExecuteDelays.map((delayData) => delayData.newDelay),
  GrantDelays.map((delayData) => delayData.newDelay),
].flat();

if (delays.some((delay) => delay < SHORT_DELAY || delay > LONG_DELAY)) {
  throw new Error('Delays outside expected bounds');
}
