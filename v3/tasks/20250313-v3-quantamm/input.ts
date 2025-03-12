import { MONTH } from '@helpers/time';
import { Task, TaskMode } from '@src';

export type QuantAMMDeploymentInputParams = {
  Vault: string;
  PauseWindowDuration: number;
  WETH: string;
  BAL: string;
  FactoryVersion: string;
  PoolVersion: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);
const BAL = new Task('00000000-tokens', TaskMode.READ_ONLY);

const ChainlinkSepoliaDataFeedETH = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
const ChainlinkSepoliaDataFeedUSDC = "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E";
const ChainlinkSepoliaDataFeedBTC = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43";

const BaseVersion = { version: 1, deployment: '20250312-v3-quantamm' };

export default {
  Vault,
  PauseWindowDuration: 4 * 12 * MONTH,
  WETH,
  BAL,
  FactoryVersion: JSON.stringify({ name: 'QuantAMMWeightedPool', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'QuantAMMWeightedPool', ...BaseVersion }),
  ChainlinkSepoliaDataFeedETH,
  ChainlinkSepoliaDataFeedUSDC,
  ChainlinkSepoliaDataFeedBTC,
};
