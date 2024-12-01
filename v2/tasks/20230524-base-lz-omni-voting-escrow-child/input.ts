import { Task, TaskMode } from '@src';

export type OmniVotingEscrowChildDeployment = {
  LayerZeroEndpoint: string;
  L2LayerZeroBridgeForwarder: string;
};

const L2LayerZeroBridgeForwarder = new Task('20230404-l2-layer0-bridge-forwarder', TaskMode.READ_ONLY);

export default {
  L2LayerZeroBridgeForwarder,
  // https://basescan.org/address/0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7
  base: {
    LayerZeroEndpoint: '0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7',
  },
};
