import { Task, TaskMode } from '@src';

type MigrateBoostCall = {
  from: string;
  to: string;
  end_time: number;
};

type SetApprovalForAllCall = {
  operator: string;
  delegator: string;
};

const VotingEscrow = new Task('20220325-gauge-controller', TaskMode.READ_ONLY);
const VeBoostV2 = new Task('20221205-veboost-v2', TaskMode.READ_ONLY);

export type VeBoostV21Deployment = {
  VotingEscrow: string;
  VeBoostV2: string;
  PreseededBoostCalls: MigrateBoostCall[];
  PreseededApprovalCalls: SetApprovalForAllCall[];
};

export default {
  VotingEscrow,
  VeBoostV2,
  mainnet: {
    // Amounts and start times included for reference.
    PreseededBoostCalls: [
      {
        // tx: 0x494930339e854d855b9d96f940a8535d86fc0bbc586847713a4d168ff43270f3
        from: '0x6d7003C9366AdCE15433090a5179157995bff620',
        to: '0xea79d1A83Da6DB43a85942767C389fE0ACf336A5',
        // amount: bn('26292826216057311443'),
        // start_time: 1736399183,
        end_time: 1759968000, // 10/9/25
      },
      {
        // tx: 0xa44aac2544ddd237363ac2d2b300a75c057424a30f4c68693636cb48154667f1
        from: '0xA58f6c3Ff171523BE8Ca7094422fc5D1864AE683',
        to: '0xea79d1A83Da6DB43a85942767C389fE0ACf336A5',
        // amount: bn('1637164145089059973'),
        // start_time: 1724977943,
        end_time: 1753920000, // 7/31/25
      },
    ],
    PreseededApprovalCalls: [
      {
        operator: '0xB9fA147b96BbC932e549f619A448275855b9A7D9', // Tetu operator (Gnosis Safe)
        delegator: '0x9cC56Fa7734DA21aC88F6a816aF10C5b898596Ce', // TetuBAL locker
      },
      {
        operator: '0xB0552b6860CE5C0202976Db056b5e3Cc4f9CC765', // Stake DAO operator multi-sig
        delegator: '0xea79d1A83Da6DB43a85942767C389fE0ACf336A5', // sdBAL locker
      },
    ],
  },
  sepolia: {
    PreseededBoostCalls: [],
    PreseededApprovalCalls: [],
  },
};
