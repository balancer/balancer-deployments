import { Task, TaskMode } from '@src';

export type FraxtalRootGaugeFactoryDeployment = {
  Vault: string;
  BalancerMinter: string;
  FraxtalBAL: string;
  L1StandardBridge: string;
  GasLimit: number;
  Network: string;
};

const Tokens = new Task('00000000-tokens', TaskMode.READ_ONLY);
const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);
const BalancerMinter = new Task('20220325-gauge-controller', TaskMode.READ_ONLY);

export default {
  mainnet: {
    Vault,
    BalancerMinter,
    FraxtalBAL: Tokens.output({ network: 'fraxtal' }).BAL,
    // Deposit TX sample: https://etherscan.io/tx/0xbbff35c8add8d11f2fac562731ec9dab58582c3a14b64580d01b8c757fc976bd
    L1StandardBridge: '0x34C0bD5877A5Ee7099D0f5688D65F4bB9158BDE2',
    // Value taken from TX sample directly.
    GasLimit: 200000,
    Network: 'Fraxtal',
  },
};
