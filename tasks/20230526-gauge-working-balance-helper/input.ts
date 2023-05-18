import { Task, TaskMode } from '@src';

export type GaugeWorkingBalanceHelperDeployment = {
  VotingEscrowDelegationProxy: string;
  ReadTotalSupplyFromVE: boolean;
};

export default {
  mainnet: {
    VotingEscrowDelegationProxy: new Task('20220325-ve-delegation', TaskMode.READ_ONLY).output({ network: 'mainnet' })
      .VotingEscrowDelegationProxy,
    ReadTotalSupplyFromVE: true,
  },
  polygon: {
    VotingEscrowDelegationProxy: new Task('20230316-l2-ve-delegation-proxy', TaskMode.READ_ONLY).output({
      network: 'polygon',
    }).VotingEscrowDelegationProxy,
    ReadTotalSupplyFromVE: false,
  },
  arbitrum: {
    VotingEscrowDelegationProxy: new Task('20230316-l2-ve-delegation-proxy', TaskMode.READ_ONLY).output({
      network: 'arbitrum',
    }).VotingEscrowDelegationProxy,
    ReadTotalSupplyFromVE: false,
  },
  optimism: {
    VotingEscrowDelegationProxy: new Task('20230316-l2-ve-delegation-proxy', TaskMode.READ_ONLY).output({
      network: 'optimism',
    }).VotingEscrowDelegationProxy,
    ReadTotalSupplyFromVE: false,
  },
  gnosis: {
    VotingEscrowDelegationProxy: new Task('20230316-l2-ve-delegation-proxy', TaskMode.READ_ONLY).output({
      network: 'gnosis',
    }).VotingEscrowDelegationProxy,
    ReadTotalSupplyFromVE: false,
  },
  avalanche: {
    VotingEscrowDelegationProxy: new Task('20230316-l2-ve-delegation-proxy', TaskMode.READ_ONLY).output({
      network: 'avalanche',
    }).VotingEscrowDelegationProxy,
    ReadTotalSupplyFromVE: false,
  },
  zkevm: {
    VotingEscrowDelegationProxy: new Task('20230316-l2-ve-delegation-proxy', TaskMode.READ_ONLY).output({
      network: 'zkevm',
    }).VotingEscrowDelegationProxy,
    ReadTotalSupplyFromVE: false,
  },
  goerli: {
    VotingEscrowDelegationProxy: new Task('20220325-ve-delegation', TaskMode.READ_ONLY).output({ network: 'goerli' })
      .VotingEscrowDelegationProxy,
    ReadTotalSupplyFromVE: true,
  },
  sepolia: {
    VotingEscrowDelegationProxy: new Task('20220325-ve-delegation', TaskMode.READ_ONLY).output({ network: 'sepolia' })
      .VotingEscrowDelegationProxy,
    ReadTotalSupplyFromVE: true,
  },
};
