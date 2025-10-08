import { Task, TaskMode } from '@src';

export type CompositeLiquidityRouter = {
  Vault: string;
  WETH: string;
  CompositeLiquidityRouterVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);
const BaseVersion = { version: 1, deployment: '20251010-v3-aggregator-composite-liquidity-router' };

export default {
  Vault,
  WETH,
  CompositeLiquidityRouterVersion: JSON.stringify({ name: 'CompositeLiquidityRouter', ...BaseVersion }),
};
