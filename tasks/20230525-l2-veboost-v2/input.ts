import Task, { TaskMode } from 'task';

export type L2VeBoostV2Deployment = {
  VotingEscrow: string;
};

export default {
  // https://polygonscan.com/address/0xE241C6e48CA045C7f631600a0f1403b2bFea05ad
  polygon: {
    VotingEscrow: new Task('20230524-lz-omni-voting-escrow-child', TaskMode.READ_ONLY).output({
      network: 'polygon',
    }).OmniVotingEscrowChild,
  },
  // https://arbiscan.io/address/0xe241c6e48ca045c7f631600a0f1403b2bfea05ad
  arbitrum: {
    VotingEscrow: new Task('20230524-lz-omni-voting-escrow-child', TaskMode.READ_ONLY).output({
      network: 'arbitrum',
    }).OmniVotingEscrowChild,
  },
  // https://optimistic.etherscan.io/address/0xe241c6e48ca045c7f631600a0f1403b2bfea05ad
  optimism: {
    VotingEscrow: new Task('20230524-lz-omni-voting-escrow-child', TaskMode.READ_ONLY).output({
      network: 'optimism',
    }).OmniVotingEscrowChild,
  },
  // https://gnosisscan.io/address/0xe241c6e48ca045c7f631600a0f1403b2bfea05ad
  gnosis: {
    VotingEscrow: new Task('20230524-lz-omni-voting-escrow-child', TaskMode.READ_ONLY).output({
      network: 'gnosis',
    }).OmniVotingEscrowChild,
  },
  // https://snowtrace.io/address/0xe241c6e48ca045c7f631600a0f1403b2bfea05ad
  avalanche: {
    VotingEscrow: new Task('20230524-lz-omni-voting-escrow-child', TaskMode.READ_ONLY).output({
      network: 'avalanche',
    }).OmniVotingEscrowChild,
  },
  // https://zkevm.polygonscan.com/address/0xe241c6e48ca045c7f631600a0f1403b2bfea05ad
  zkevm: {
    VotingEscrow: new Task('20230524-lz-omni-voting-escrow-child', TaskMode.READ_ONLY).output({
      network: 'zkevm',
    }).OmniVotingEscrowChild,
  },
  // https://basescan.org/address/0xE241C6e48CA045C7f631600a0f1403b2bFea05ad
  base: {
    VotingEscrow: new Task('20230524-base-lz-omni-voting-escrow-child', TaskMode.READ_ONLY).output({
      network: 'base',
    }).OmniVotingEscrowChild,
  },
  // https://basescan.org/address/0xE241C6e48CA045C7f631600a0f1403b2bFea05ad
  fraxtal: {
    VotingEscrow: new Task('20230524-lz-omni-voting-escrow-child', TaskMode.READ_ONLY).output({
      network: 'fraxtal',
    }).OmniVotingEscrowChild,
  },
};
