import { Task, TaskMode } from '@src';

const EthChainlinkOracleWrapper = new Task('20250419-v3-eth-oraclewrapper', TaskMode.READ_ONLY);

export type QuantAMMDeploymentInputParams = {
  QuantAMMAdmin: string;
  ChainlinkFeedETH: string;
};

export default {
  sepolia: {
    QuantAMMAdmin: '0xd785201fd2D9be7602F6682296Bb415530C027Ef',
    ChainlinkFeedETH: EthChainlinkOracleWrapper,
  },
  mainnet: {
    QuantAMMAdmin: '0xd785201fd2D9be7602F6682296Bb415530C027Ef',
    ChainlinkFeedETH: EthChainlinkOracleWrapper,
  },
  base: {
    QuantAMMAdmin: '0xd785201fd2D9be7602F6682296Bb415530C027Ef',
    ChainlinkFeedETH: EthChainlinkOracleWrapper,
  },
  arbitrum: {
    QuantAMMAdmin: '0xd785201fd2D9be7602F6682296Bb415530C027Ef',
    ChainlinkFeedETH: EthChainlinkOracleWrapper,
  },
  sonic: {
    QuantAMMAdmin: '0xd785201fd2D9be7602F6682296Bb415530C027Ef',
    ChainlinkFeedETH: EthChainlinkOracleWrapper,
  },
};
