import { Task, TaskMode } from '@src';

export type OmniVotingEscrowDeployment = {
  LayerZeroEndpoint: string;
  VotingEscrowRemapper: string;
};

const VotingEscrowRemapper = new Task('20230504-vebal-remapper', TaskMode.READ_ONLY);

export default {
  VotingEscrowRemapper,
  // https://docs.layerzero.network/v1/developers/evm/technical-reference/mainnet/mainnet-addresses
  LayerZeroEndpoint: '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
};
