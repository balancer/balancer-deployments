import { Task, TaskMode } from '@src';

export type GaugeSystemDeployment = {
  BPT: string;
  BalancerTokenAdmin: string;
  AuthorizerAdaptor: string;
};

const AuthorizerAdaptor = new Task('20220325-authorizer-adaptor', TaskMode.READ_ONLY);
const BalancerTokenAdmin = new Task('20220325-balancer-token-admin', TaskMode.READ_ONLY);

export default {
  AuthorizerAdaptor,
  BalancerTokenAdmin,
  mainnet: {
    BPT: '0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56', // BPT of the canonical 80-20 BAL-WETH Pool
  },
  sepolia: {
    BPT: '0x650C15c9CFc6063e5046813f079774f56946dF21', // BPT of an 80-20 BAL-WETH Pool using test BAL
  },
};
