import { Task, TaskMode } from '@src';

type CreateBoostCall = {
  from: string;
  to: string;
  amount: bigint;
  start_time: number;
  end_time: number;
};

type SetApprovalForAllCall = {
  operator: string;
  delegator: string;
};

const VotingEscrow = new Task('20220325-gauge-controller', TaskMode.READ_ONLY);

export type VeBoostV21Deployment = {
  VotingEscrow: string;
  PreseededBoostCalls: CreateBoostCall[];
  PreseededApprovalCalls: SetApprovalForAllCall[];
};

export default {
  VotingEscrow,
  mainnet: {
    PreseededBoostCalls: [
      {
        // tx: 0xb1795fffafd3741569d1d4d348483938c018034c65e4415056d4a18a4da1601b
        from: '0x250Dc31d9eCD8AF562f506b40d0dE4349C987E92',
        to: '0xea79d1A83Da6DB43a85942767C389fE0ACf336A5',
        amount: 9575170789062471648420,
        start_time: 1748360315,
        end_time: 1750896000, // 6/26/25
      },
      {
        // tx: 0x017e056002635a65f7afee99c5b0a3544189c432e3065edcf33f42bcfbd6dfaf
        from: '0x719a143654a0C4621F49FA77077800ef3F5C3b40',
        to: '0xea79d1A83Da6DB43a85942767C389fE0ACf336A5',
        amount: 217734180858584444,
        start_time: 1747403627,
        end_time: 1749686400, // 6/12/25
      },
      {
        // tx: 0x517130237936396be083728f29d520be56110a2b2c86a09631b7accde52e4635
        from: '0x719a143654a0C4621F49FA77077800ef3F5C3b40',
        to: '0xea79d1A83Da6DB43a85942767C389fE0ACf336A5',
        amount: 8732663871263516470,
        start_time: 1747340195,
        end_time: 1749686400, // 6/12/25
      },
      {
        // tx: 0x494930339e854d855b9d96f940a8535d86fc0bbc586847713a4d168ff43270f3
        from: '0x6d7003C9366AdCE15433090a5179157995bff620',
        to: '0xea79d1A83Da6DB43a85942767C389fE0ACf336A5',
        amount: 26292826216057311443,
        start_time: 1736399183,
        end_time: 1759968000, // 10/9/25
      },
      {
        // tx: 0xa44aac2544ddd237363ac2d2b300a75c057424a30f4c68693636cb48154667f1
        from: '0xA58f6c3Ff171523BE8Ca7094422fc5D1864AE683',
        to: '0xea79d1A83Da6DB43a85942767C389fE0ACf336A5',
        amount: 1637164145089059973,
        start_time: 1724977943,
        end_time: 1753920000, // 7/31/25
      },
      {
        // tx: 0x148b4ad2b40f6f10dec822c523fdc109d605d398049cbeddad375a2b99ae0aca
        from: '0x278a8453ECf2f477a5Ab3Cd9b0Ea410b7B2C4182',
        to: '0xea79d1A83Da6DB43a85942767C389fE0ACf336A5',
        amount: 19747907203562458212,
        start_time: 1719216503,
        end_time: 1750291200, // 6/19/25
      },
    ],
    PreseededApprovalCalls: [
      {
        operator: '0x308A756B4f9aa3148CaD7ccf8e72c18C758b2EF2',  // Tetu operator
        delegator: '0x9cC56Fa7734DA21aC88F6a816aF10C5b898596Ce', // TetuBAL locker
      },
      {
        operator: '0xB0552b6860CE5C0202976Db056b5e3Cc4f9CC765',  // Stake DAO operator multi-sig
        delegator: '0xc4EAc760C2C631eE0b064E39888b89158ff808B2', // sdBAL locker
      },
    ],
  },
  sepolia: {
    PreseededBoostCalls: [],
    PreseededApprovalCalls: [],
  },
};
