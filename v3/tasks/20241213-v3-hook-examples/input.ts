import { Task, TaskMode } from '@src';

export type HookExamplesDeployment = {
  Vault: string;
  StablePoolFactory: string;
  Router: string;
  WETH: string;
  Permit2: string;
  NftLiquidityPositionExampleVersion: string;
  VotingEscrow: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const StablePoolFactory = new Task('20241205-v3-stable-pool', TaskMode.READ_ONLY);
const Router = new Task('20241205-v3-router', TaskMode.READ_ONLY);
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);
const Permit2 = new Task('00000000-permit2', TaskMode.READ_ONLY);
const BaseVersion = { version: 1, deployment: '20241213-v3-hook-examples' };
const VotingEscrow = new Task('20220325-gauge-controller', TaskMode.READ_ONLY);

export default {
  Vault,
  StablePoolFactory,
  Router,
  WETH,
  Permit2,
  NftLiquidityPositionExampleVersion: JSON.stringify({ name: 'NftLiquidityPositionExample', ...BaseVersion }),
  VotingEscrow,
};
