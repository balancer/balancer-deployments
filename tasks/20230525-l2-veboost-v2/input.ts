export type L2VeBoostV2Deployment = {
  VotingEscrow: string;
};

export default {
  // https://github.com/LayerZero-Labs/lz_gauges/blob/main/deployments/polygon/OmniVotingEscrowChild.json#LL2C15-L2C57
  polygon: {
    VotingEscrow: '0xE241C6e48CA045C7f631600a0f1403b2bFea05ad',
  },
  // https://github.com/LayerZero-Labs/lz_gauges/blob/main/deployments/arbitrum/OmniVotingEscrowChild.json#LL2C15-L2C57
  arbitrum: {
    VotingEscrow: '0xE241C6e48CA045C7f631600a0f1403b2bFea05ad',
  },
  // https://github.com/LayerZero-Labs/lz_gauges/blob/main/deployments/optimism/OmniVotingEscrowChild.json#LL2C15-L2C57
  optimism: {
    VotingEscrow: '0xE241C6e48CA045C7f631600a0f1403b2bFea05ad',
  },
  // https://github.com/LayerZero-Labs/lz_gauges/blob/main/deployments/gnosis/OmniVotingEscrowChild.json#LL2C15-L2C57
  gnosis: {
    VotingEscrow: '0xE241C6e48CA045C7f631600a0f1403b2bFea05ad',
  },
};
