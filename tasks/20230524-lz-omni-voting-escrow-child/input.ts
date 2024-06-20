import { Task, TaskMode } from '@src';

export type OmniVotingEscrowChildDeployment = {
  LayerZeroEndpoint: string;
  L2LayerZeroBridgeForwarder: string;
};

const L2LayerZeroBridgeForwarder = new Task('20230404-l2-layer0-bridge-forwarder', TaskMode.READ_ONLY);

export default {
  L2LayerZeroBridgeForwarder,
  // https://polygonscan.com/address/0x3c2269811836af69497E5F486A85D7316753cf62
  polygon: {
    LayerZeroEndpoint: '0x3c2269811836af69497E5F486A85D7316753cf62',
  },
  // https://arbiscan.io/address/0x3c2269811836af69497E5F486A85D7316753cf62
  arbitrum: {
    LayerZeroEndpoint: '0x3c2269811836af69497E5F486A85D7316753cf62',
  },
  // https://optimistic.etherscan.io/address/0x3c2269811836af69497E5F486A85D7316753cf62
  optimism: {
    LayerZeroEndpoint: '0x3c2269811836af69497E5F486A85D7316753cf62',
  },
  // https://gnosisscan.io/address/0x9740FF91F1985D8d2B71494aE1A2f723bb3Ed9E4
  gnosis: {
    LayerZeroEndpoint: '0x9740FF91F1985D8d2B71494aE1A2f723bb3Ed9E4',
  },
  // https://snowtrace.io/address/0x3c2269811836af69497E5F486A85D7316753cf62
  avalanche: {
    LayerZeroEndpoint: '0x3c2269811836af69497E5F486A85D7316753cf62',
  },
  // https://zkevm.polygonscan.com/address/0x9740FF91F1985D8d2B71494aE1A2f723bb3Ed9E4
  zkevm: {
    LayerZeroEndpoint: '0x9740FF91F1985D8d2B71494aE1A2f723bb3Ed9E4',
  },
  // https://basescan.org/address/0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7
  base: {
    LayerZeroEndpoint: '0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7',
  },
  // https://fraxscan.com/address/0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7
  fraxtal: {
    LayerZeroEndpoint: '0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7',
  },
};
