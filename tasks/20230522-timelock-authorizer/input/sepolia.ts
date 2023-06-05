import { DAY } from '@helpers/time';
import { Task, TaskMode } from '@src';
import { DelayData, RoleData } from './types';

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY, 'sepolia');

const BalancerTokenAdmin = new Task('20220325-balancer-token-admin', TaskMode.READ_ONLY, 'sepolia');
const GaugeController = new Task('20220325-gauge-controller', TaskMode.READ_ONLY, 'sepolia');
const VotingEscrowDelegationProxy = new Task('20220325-ve-delegation', TaskMode.READ_ONLY, 'sepolia');

const MainnetGaugeFactory = new Task('20220822-mainnet-gauge-factory-v2', TaskMode.READ_ONLY, 'sepolia');
const L2VotingEscrowDelegationProxy = new Task('20230316-l2-ve-delegation-proxy', TaskMode.READ_ONLY, 'sepolia');
const L2BalancerPseudoMinter = new Task('20230316-l2-balancer-pseudo-minter', TaskMode.READ_ONLY, 'sepolia');
const L2Layer0BridgeForwarder = new Task('20230404-l2-layer0-bridge-forwarder', TaskMode.READ_ONLY, 'sepolia');
const VeBALRemapper = new Task('20230504-vebal-remapper', TaskMode.READ_ONLY, 'sepolia');

const SmartWalletChecker = new Task('20220420-smart-wallet-checker', TaskMode.READ_ONLY, 'sepolia');
const ProtocolFeeWithdrawer = new Task('20220517-protocol-fee-withdrawer', TaskMode.READ_ONLY, 'sepolia');
const ProtocolFeePercentagesProvider = new Task(
  '20220725-protocol-fee-percentages-provider',
  TaskMode.READ_ONLY,
  'sepolia'
);
const ProtocolIdRegistry = new Task('20230223-protocol-id-registry', TaskMode.READ_ONLY, 'sepolia');

export const Root = '0x171C0fF5943CE5f133130436A29bF61E26516003';

// Happens frequently
const SHORT_DELAY = 0.25 * DAY;

// May happen frequently but can be dangerous
const MEDIUM_DELAY = DAY;

// Happens basically never. A long grant delay typically involves replacing infrastructure (e.g. replacing the veBAL
// system or protocol fees).
const LONG_DELAY = 2 * DAY;

export const RootTransferDelay = LONG_DELAY;

export const GrantDelays: DelayData[] = [
  // BAL is minted by the BalancerMinter. Changing the minter means changing the veBAL liquidity mining system.
  {
    actionId: BalancerTokenAdmin.actionId('BalancerTokenAdmin', 'mint(address,uint256)'),
    newDelay: LONG_DELAY,
  },

  // Adding gauges is dangerous since they can mint BAL. This permission is granted to the GaugeAdder.
  {
    actionId: GaugeController.actionId('GaugeController', 'add_gauge(address,int128)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: GaugeController.actionId('GaugeController', 'add_gauge(address,int128,uint256)'),
    newDelay: MEDIUM_DELAY,
  },

  // Relayer permissions - all of these are dangerous since relayers are powerful, but they also opt-in by each user.
  {
    actionId: Vault.actionId('Vault', 'setRelayerApproval(address,address,bool)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: Vault.actionId(
      'Vault',
      'swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)'
    ),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: Vault.actionId(
      'Vault',
      'batchSwap(uint8,(bytes32,uint256,uint256,uint256,bytes)[],address[],(address,bool,address,bool),int256[],uint256)'
    ),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: Vault.actionId('Vault', 'joinPool(bytes32,address,address,(address[],uint256[],bytes,bool))'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: Vault.actionId('Vault', 'exitPool(bytes32,address,address,(address[],uint256[],bytes,bool))'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: Vault.actionId('Vault', 'manageUserBalance((uint8,address,uint256,address,address)[])'),
    newDelay: MEDIUM_DELAY,
  },

  // The permission to withdraw protocol fees is held solely by the ProtocolFeeWithdrawer.
  {
    actionId: Vault.actionId('ProtocolFeesCollector', 'withdrawCollectedFees(address[],uint256[],address)'),
    newDelay: LONG_DELAY,
  },
  // The permission to modify protocol fees at the Collector is held by the ProtocolFeePercentagesProvider.
  {
    actionId: Vault.actionId('ProtocolFeesCollector', 'setSwapFeePercentage(uint256)'),
    newDelay: LONG_DELAY,
  },
  {
    actionId: Vault.actionId('ProtocolFeesCollector', 'withdrawCollectedFees(address[],uint256[],address)'),
    newDelay: LONG_DELAY,
  },
];

export const getRoles: () => Promise<RoleData[]> = async () => [];

export const Granters: RoleData[] = [];

export const Revokers: RoleData[] = [];

export const ExecuteDelays: DelayData[] = [
  // setAuthorizer must be long since no delay can be longer than it.
  { actionId: Vault.actionId('Vault', 'setAuthorizer(address)'), newDelay: LONG_DELAY },

  // Allowlisting addresses to hold veBAL is relatively risk free.
  {
    actionId: SmartWalletChecker.actionId('SmartWalletChecker', 'allowlistAddress(address)'),
    newDelay: SHORT_DELAY,
  },

  // This action would replace the SmartWalletChecker.
  {
    actionId: GaugeController.actionId('VotingEscrow', 'apply_smart_wallet_checker()'),
    newDelay: LONG_DELAY,
  },

  // This would replace the ve boost system.
  {
    actionId: VotingEscrowDelegationProxy.actionId('VotingEscrowDelegationProxy', 'setDelegation(address)'),
    newDelay: LONG_DELAY,
  },

  // These actions are 'disabled' - we don't mean to ever use them.
  {
    actionId: GaugeController.actionId('GaugeController', 'change_type_weight(int128,uint256)'),
    newDelay: LONG_DELAY,
  },
  {
    actionId: GaugeController.actionId('GaugeController', 'change_gauge_weight(address,uint256)'),
    newDelay: LONG_DELAY,
  },

  // These are typically associated with setting up a new network, though they are not strictly needed. They are not
  // risky however.
  {
    actionId: GaugeController.actionId('GaugeController', 'add_type(string)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: GaugeController.actionId('GaugeController', 'add_type(string,uint256)'),
    newDelay: MEDIUM_DELAY,
  },

  // We don't currently use this but there's no huge risk in doing so.
  {
    actionId: BalancerTokenAdmin.actionId('BalancerTokenAdmin', 'snapshot()'),
    newDelay: MEDIUM_DELAY,
  },

  // This creates a new protocol fee type, but there's no huge risk since nothing will use it.
  {
    actionId: ProtocolFeePercentagesProvider.actionId(
      'ProtocolFeePercentagesProvider',
      'registerFeeType(uint256,string,uint256,uint256)'
    ),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: ProtocolFeePercentagesProvider.actionId(
      'ProtocolFeePercentagesProvider',
      'setFeeTypePercentage(uint256,uint256)'
    ),
    newDelay: MEDIUM_DELAY,
  },

  // Layer0 config
  {
    actionId: L2Layer0BridgeForwarder.actionId('L2LayerZeroBridgeForwarder', 'setDelegation(address)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: VeBALRemapper.actionId('OmniVotingEscrowAdaptor', 'setAdapterParams(bytes)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: VeBALRemapper.actionId('OmniVotingEscrowAdaptor', 'setOmniVotingEscrow(address)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: VeBALRemapper.actionId('OmniVotingEscrowAdaptor', 'setUseZero(bool)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: VeBALRemapper.actionId('OmniVotingEscrowAdaptor', 'setZeroPaymentAddress(address)'),
    newDelay: MEDIUM_DELAY,
  },

  // Gauge configuration
  {
    actionId: MainnetGaugeFactory.actionId('LiquidityGaugeV5', 'set_reward_distributor(address,address)'),
    newDelay: MEDIUM_DELAY,
  },

  // Boost Configuration
  {
    actionId: L2VotingEscrowDelegationProxy.actionId('VotingEscrowDelegationProxy', 'setDelegation(address)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: L2BalancerPseudoMinter.actionId('L2BalancerPseudoMinter', 'addGaugeFactory(address)'),
    newDelay: MEDIUM_DELAY,
  },
  {
    actionId: L2BalancerPseudoMinter.actionId('L2BalancerPseudoMinter', 'removeGaugeFactory(address)'),
    newDelay: MEDIUM_DELAY,
  },

  // Operational actions taken frequently

  {
    actionId: MainnetGaugeFactory.actionId('LiquidityGaugeV5', 'add_reward(address,address)'),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: MainnetGaugeFactory.actionId('LiquidityGaugeV5', 'setRelativeWeightCap(uint256)'),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: ProtocolFeeWithdrawer.actionId(
      'ProtocolFeesWithdrawer',
      'withdrawCollectedFees(address[],uint256[],address)'
    ),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: ProtocolIdRegistry.actionId('ProtocolIdRegistry', 'registerProtocolId(uint256,string)'),
    newDelay: SHORT_DELAY,
  },
  {
    actionId: ProtocolIdRegistry.actionId('ProtocolIdRegistry', 'renameProtocolId(uint256,string)'),
    newDelay: SHORT_DELAY,
  },

  {
    actionId: VeBALRemapper.actionId('VotingEscrowRemapper', 'setNetworkRemappingManager(address,address)'),
    newDelay: SHORT_DELAY,
  },
];
