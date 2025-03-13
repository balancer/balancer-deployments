import { MONTH } from '@helpers/time';
import { Task, TaskMode } from '@src';
import { ethers } from 'ethers';
import { bn } from '@helpers/numbers';
import { ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';

export type QuantAMMDeploymentInputParams = {
  Vault: string;
  PauseWindowDuration: number;
  USDC: string;
  WBTC: string;
  FactoryVersion: string;
  PoolVersion: string;
  ChainlinkFeedETH: string;
  ChainlinkDataFeedUSDC: string;
  ChainlinkDataFeedBTC: string;
};

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const USDC = new Task('00000000-tokens', TaskMode.READ_ONLY);
const WBTC = new Task('00000000-tokens', TaskMode.READ_ONLY);

const ChainlinkSepoliaDataFeedETH = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
const ChainlinkSepoliaDataFeedUSDC = "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E";
const ChainlinkSepoliaDataFeedBTC = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43";

//https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum&page=1&search=eth+%2F+usd
const ChainlinkMainnetDataFeedETH = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";

//https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum&page=1&search=usdc+%2F+usd
const ChainlinkMainnetDataFeedUSDC = "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6";

//https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum&page=1&search=btc+%2F+usd
const ChainlinkMainnetDataFeedBTC = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43";

const BaseVersion = { version: 1, deployment: '20250312-v3-quantamm' };

export default {
  Vault,
  PauseWindowDuration: 4 * 12 * MONTH,
  USDC,
  WBTC,
  FactoryVersion: JSON.stringify({ name: 'QuantAMMWeightedPool', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'QuantAMMWeightedPool', ...BaseVersion }),
  sepolia:{
    ChainlinkSepoliaDataFeedETH,
    ChainlinkSepoliaDataFeedUSDC,
    ChainlinkSepoliaDataFeedBTC,
  },
  mainnet:{
    ChainlinkFeedETH: ChainlinkMainnetDataFeedETH,
    ChainlinkDataFeedUSDC: ChainlinkMainnetDataFeedUSDC,
    ChainlinkDataFeedBTC: ChainlinkMainnetDataFeedBTC,
  }
};


type PoolRoleAccounts = {
  // Define the structure based on Solidity contract
};

type TokenConfig = {
  token: string;
  rateProvider?: string;
  tokenType: string;
};

type PoolSettings = {
  assets: string[];
  rule: string;
  oracles: string[][];
  updateInterval: number;
  lambda: bigint[];
  epsilonMax: bigint;
  absoluteWeightGuardRail: bigint;
  maxTradeSizeRatio: bigint;
  ruleParameters: bigint[][];
  poolManager: string;
};


export type CreationNewPoolParams = {
  name: string;
  symbol: string;
  tokens: TokenConfig[];
  normalizedWeights: bigint[];
  roleAccounts: PoolRoleAccounts;
  swapFeePercentage: bigint;
  poolHooksContract: string;
  enableDonation: boolean;
  disableUnbalancedLiquidity: boolean;
  salt: string;
  initialWeights: bigint[];
  poolSettings: PoolSettings;
  initialMovingAverages: bigint[];
  initialIntermediateValues: bigint[];
  oracleStalenessThreshold: number;
  poolRegistry: number;
  poolDetails: string[][];
};

export async function createPoolParams(usdcAddress: string, usdcOracle: string, wbtcAddress: string, wbtcOracle: string, ruleAddress: string): Promise<CreationNewPoolParams> {
  const tokens = [
    usdcAddress, // USDC Sepolia
    wbtcAddress, // WBTC Sepolia
  ];

  const rateProviders: string[] = [];
  const roleAccounts: PoolRoleAccounts = {} as PoolRoleAccounts;

  const tokenConfig: TokenConfig[] = tokens.map((token, i) => ({
    token,
    rateProvider: rateProviders[i] || ZERO_ADDRESS,
    tokenType: rateProviders[i] ? "WITH_RATE" : "STANDARD",
  }));

  const sortedTokenConfig = tokenConfig.sort((a, b) => a.token.localeCompare(b.token));

  const lambdas = [bn("200000000000000000")];

  const intermediateValueStubs = [bn("1000000000000000000"), bn("1000000000000000000")];

  const parameters = [[bn("200000000000000000")]];

  const oracles = [
    [usdcOracle], // USDC
    [wbtcOracle], // WBTC
  ];

  const normalizedWeights = [bn("500000000000000000"), bn("500000000000000000")];
  const intNormalizedWeights = [...normalizedWeights];

  const poolDetails = [["Overview", "Adaptability", "number", "5"]];

  const salt = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode([
    "address",
    "uint256"
  ], [await ethers.provider.getSigner().getAddress(), Math.floor(Date.now() / 1000)]));

  const poolSettings: PoolSettings = {
    assets: tokens,
    rule: ruleAddress,
    oracles,
    updateInterval: 60,
    lambda: lambdas,
    epsilonMax: bn("200000000000000000"),
    absoluteWeightGuardRail: bn("200000000000000000"),
    maxTradeSizeRatio: bn("300000000000000000"),
    ruleParameters: parameters,
    poolManager: await ethers.provider.getSigner().getAddress(),
  };

  return {
    name: "test quantamm pool 2",
    symbol: "test",
    tokens: sortedTokenConfig,
    normalizedWeights,
    roleAccounts,
    swapFeePercentage: bn("20000000000000000"),
    poolHooksContract: ethers.constants.AddressZero,
    enableDonation: true,
    disableUnbalancedLiquidity: false,
    salt,
    initialWeights: intNormalizedWeights,
    poolSettings,
    initialMovingAverages: intermediateValueStubs,
    initialIntermediateValues: intermediateValueStubs,
    oracleStalenessThreshold: 3600,
    poolRegistry: 16,
    poolDetails,
  };
}
