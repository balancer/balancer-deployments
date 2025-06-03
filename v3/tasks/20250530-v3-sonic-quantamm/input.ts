import { MONTH } from '@helpers/time';
import { Task, TaskMode } from '@src';
import { bn, fp } from '@helpers/numbers';
import { ZERO_ADDRESS } from '@helpers/constants';
import { BigNumber } from 'ethers';

export type QuantAMMDeploymentInputParams = {
  Vault: string;
  PauseWindowDuration: number;
  UpdateWeightRunner: string;
  WETH: string;
  scBTC: string;
  SONIC: string;
  USDC: string;
  FactoryVersion: string;
  PoolVersion: string;
  ChainlinkFeedETH: string;
  ChainlinkDataFeedBTC: string;
  ChainlinkDataFeedSONIC: string;
  ChainlinkDataFeedUSDC: string;
};

//Ttaken from the beets site
const Vault = '0xbA1333333333a1BA1108E8412f11850A5C319bA9'; //https://sonicscan.org/address/0xbA1333333333a1BA1108E8412f11850A5C319bA9

const EthChainlinkOracleWrapper = new Task('20250419-v3-eth-oraclewrapper', TaskMode.READ_ONLY);

const BtcChainlinkOracleWrapper = new Task('20250419-v3-btc-oraclewrapper', TaskMode.READ_ONLY);

const UsdcChainlinkOracleWrapper = new Task('20250419-v3-usdc-oraclewrapper', TaskMode.READ_ONLY);

const SonicChainlinkOracleWrapper = new Task('20250513-v3-sonic-oraclewrapper', TaskMode.READ_ONLY);

const UpdateWeightRunner = new Task('20250419-v3-update-weight-runner', TaskMode.READ_ONLY);

const BaseVersion = { version: 1, deployment: '20250530-v3-sonic-quantamm' };

export default {
  Vault,
  ChainlinkFeedETH: EthChainlinkOracleWrapper,
  ChainlinkDataFeedBTC: BtcChainlinkOracleWrapper,
  ChainlinkDataFeedSONIC: SonicChainlinkOracleWrapper,
  ChainlinkDataFeedUSDC: UsdcChainlinkOracleWrapper,
  PauseWindowDuration: 4 * 12 * MONTH,
  FactoryVersion: JSON.stringify({ name: 'QuantAMMWeightedPoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'QuantAMMWeightedPool', ...BaseVersion }),
  UpdateWeightRunner,
  sonic: {
    SONIC: '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38', //https://sonicscan.org/token/0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38
    USDC: '0x29219dd400f2bf60e5a23d13be72b486d4038894', //https://sonicscan.org/token/0x29219dd400f2bf60e5a23d13be72b486d4038894
    WETH: '0x50c42deacd8fc9773493ed674b675be577f2634b', //https://sonicscan.org/token/0x50c42deacd8fc9773493ed674b675be577f2634b
    scBTC: '0xbb30e76d9bb2cc9631f7fc5eb8e87b5aff32bfbd', //https://sonicscan.org/token/0xbb30e76d9bb2cc9631f7fc5eb8e87b5aff32bfbd
  },
};

type PoolRoleAccounts = {
  // Define the structure based on Solidity contract
};

type TokenConfig = {
  token: string;
  rateProvider?: string;
  tokenType: number;
};

type PoolSettings = {
  assets: string[];
  rule: string;
  oracles: string[][];
  updateInterval: number;
  lambda: BigNumber[];
  epsilonMax: BigNumber;
  absoluteWeightGuardRail: BigNumber;
  maxTradeSizeRatio: BigNumber;
  ruleParameters: BigNumber[][];
  poolManager: string;
};

export type CreationNewPoolParams = {
  name: string;
  symbol: string;
  tokens: TokenConfig[];
  normalizedWeights: BigNumber[];
  roleAccounts: PoolRoleAccounts;
  swapFeePercentage: BigNumber;
  poolHooksContract: string;
  enableDonation: boolean;
  disableUnbalancedLiquidity: boolean;
  salt: string;
  _initialWeights: BigNumber[];
  _poolSettings: PoolSettings;
  _initialMovingAverages: BigNumber[];
  _initialIntermediateValues: BigNumber[];
  _oracleStalenessThreshold: BigNumber;
  poolRegistry: BigNumber;
  poolDetails: string[][];
};

export async function createPoolParams(
  scBTCContract: string,
  btcOracle: string,
  sonicContract: string,
  sonicOracle: string,
  ethContract: string,
  ethOracle: string,
  USDCContract: string,
  usdcOracle: string,
  ruleAddress: string,
  salt: string,
  sender: string
): Promise<CreationNewPoolParams> {
  const tokens = [sonicContract, USDCContract, ethContract, scBTCContract]; //address ordering as in InputHelper.sortTokens

  const rateProviders: string[] = [];

  const tokenConfig: TokenConfig[] = tokens.map((token, i) => ({
    token,
    rateProvider: rateProviders[i] || ZERO_ADDRESS,
    tokenType: 0,
  }));

  const lambdas = [
    bn('811035769801363300'),
    bn('781490597023096500'),
    bn('289524066401247700'),
    bn('289524066401247700'),
  ];
  //const lambdas = [bn('0.811035769801363300'), bn('0.781490597023096500'), bn('0.289524066401247700')];

  const movingAverages = [
    bn('94942928796381976374946'),
    bn('3318477539169648631581'),
    bn('999995937643198773'),
    bn('999995937643198773'),
  ];
  //const movingAverages = [bn('94942.928796381976374946'), bn('3318.477539169648631581'), bn('0.999995937643198773')];

  const intermediateValues = [
    bn('47164825037595406235540'),
    bn('269029300295401773334'),
    bn('14503442449845'),
    bn('14503442449845'),
  ];
  //const intermediateValues = [bn('47164.825037595406235540'), bn('269.029300295401773334'), bn('0.000014503442449845')];

  const parameters = [
    [
      bn('1390968414526753800000'),
      bn('806695362159777100000'),
      bn('255928993330991830000'),
      bn('255928993330991830000'),
    ], //kappa
    [bn('1531232793117663900'), bn('1000000000000000100'), bn('1000000000000000100'), bn('1000000000000000100')], //exponents
  ];

  //const parameters = [
  //  [bn('1390.968414526753800000'), bn('806.695362159777100000'), bn('255.928993330991830000')], //kappa
  //  [bn('1.531232793117663900'), bn('1.000000000000000100'), bn('1.000000000000000100')], //exponents
  //];

  //again this is in InputHelper.sortTokens order
  const oracles = [
    [sonicOracle], // SONIC
    [usdcOracle], // USDC
    [ethOracle], // eth
    [btcOracle], // WBTC
  ];

  const normalizedWeights = [
    bn('439096623000000000'),
    bn('462022194000000000'),
    bn('98881183000000000'),
    bn('98881183000000000'),
  ];
  //const normalizedWeights = [bn('0.439096623000000000'), bn('0.462022194000000000'), fp('0.098881183000000000')];
  const intNormalizedWeights = [...normalizedWeights];

  const poolDetails = [
    ['overview', 'adaptabilityScore', 'number', '5'],
    ['ruleDetails', 'updateRuleName', 'string', 'Power Channel'],
  ];

  const poolSettings: PoolSettings = {
    assets: tokens,
    rule: ruleAddress,
    oracles,
    updateInterval: 86100,
    lambda: lambdas,
    epsilonMax: fp(0.432),
    absoluteWeightGuardRail: fp(0.03),
    maxTradeSizeRatio: fp(0.1),
    ruleParameters: parameters,
    poolManager: sender,
  };

  return {
    name: 'TEST - SONIC - DO NOT USE',
    symbol: 'TESTBTFS',
    tokens: tokenConfig,
    normalizedWeights,
    roleAccounts: {
      pauseManager: ZERO_ADDRESS,
      swapFeeManager: ZERO_ADDRESS,
      poolCreator: ZERO_ADDRESS,
    },
    swapFeePercentage: fp(0.02),
    poolHooksContract: ZERO_ADDRESS,
    enableDonation: false,
    disableUnbalancedLiquidity: false,
    salt: salt,
    _initialWeights: intNormalizedWeights,
    _poolSettings: poolSettings,
    _initialMovingAverages: movingAverages,
    _initialIntermediateValues: intermediateValues,
    _oracleStalenessThreshold: bn('86760'), //1 day and 1 hour
    poolRegistry: bn('17'), //1 perform update, 3 getdata, 16 admin controlled.
    poolDetails,
  };
}
