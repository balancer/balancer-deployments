import { DAY } from '@helpers/time';
import { Task, TaskMode } from '@src';
import { DelayData, RoleData } from './types';

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY, 'sepolia');

const BalancerTokenAdmin = new Task('20220325-balancer-token-admin', TaskMode.READ_ONLY, 'sepolia');
const GaugeController = new Task('20220325-gauge-controller', TaskMode.READ_ONLY, 'sepolia');
const VotingEscrowDelegationProxy = new Task('20220325-ve-delegation', TaskMode.READ_ONLY, 'sepolia');
const SmartWalletChecker = new Task('20220420-smart-wallet-checker', TaskMode.READ_ONLY, 'sepolia');
const ProtocolFeeWithdrawer = new Task('20220517-protocol-fee-withdrawer', TaskMode.READ_ONLY, 'sepolia');

export const Root = '0x171C0fF5943CE5f133130436A29bF61E26516003';

const SHORT_DELAY = 0.25 * DAY;
const MEDIUM_DELAY = DAY;
const LONG_DELAY = 2 * DAY;

export const GrantDelays: DelayData[] = [
  {
    actionId: BalancerTokenAdmin.actionId('BalancerTokenAdmin', 'mint(address,uint256)'),
    newDelay: LONG_DELAY,
  },
  {
    actionId: GaugeController.actionId('GaugeController', 'add_gauge(address,int128)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: GaugeController.actionId('GaugeController', 'add_gauge(address,int128,uint256)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: GaugeController.actionId('GaugeController', 'change_type_weight(int128,uint256)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: GaugeController.actionId('GaugeController', 'change_gauge_weight(address,uint256)'),
    newDelay: MEDIUM_DELAY,
  },
  // BALTokenHolder.withdrawFunds(address, uint256) (veBAL BALTokenHolder)
  // Note this actionId can't be pulled from the json file as the BALTokenHolder is not listed there.
  { actionId: '0x79922681fd17c90b4f3409d605f5b059ffcbcef7b5440321ae93b87f3b5c1c78', newDelay: SHORT_DELAY },
  {
    actionId: Vault.actionId('Vault', 'setRelayerApproval(address,address,bool)'),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: Vault.actionId(
      'Vault',
      'batchSwap(uint8,(bytes32,uint256,uint256,uint256,bytes)[],address[],(address,bool,address,bool),int256[],uint256)'
    ),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: Vault.actionId('Vault', 'joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))'),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: Vault.actionId(
      'Vault',
      'swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)'
    ),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: Vault.actionId('Vault', 'exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))'),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: Vault.actionId('Vault', 'manageUserBalance((uint8,address,uint256,address,address)[])'),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: ProtocolFeeWithdrawer.actionId(
      'ProtocolFeesWithdrawer',
      'withdrawCollectedFees(address[],uint256[],address)'
    ),
    newDelay: SHORT_DELAY,
  },
];

export const getRoles: () => Promise<RoleData[]> = async () => [];

export const Granters: RoleData[] = [];

export const Revokers: RoleData[] = [];

export const ExecuteDelays: DelayData[] = [
  { actionId: Vault.actionId('Vault', 'setAuthorizer(address)'), newDelay: LONG_DELAY },
  {
    actionId: SmartWalletChecker.actionId('SmartWalletChecker', 'allowlistAddress(address)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: VotingEscrowDelegationProxy.actionId('VotingEscrowDelegationProxy', 'setDelegation(address)'),
    newDelay: SHORT_DELAY,
  },
];
