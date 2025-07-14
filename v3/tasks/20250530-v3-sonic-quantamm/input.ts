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
    bn('787251601222726700'),
    bn('572187959313645500'),
    bn('447941220120420800'),
    bn('929563018539273000'),
  ];
  //const lambdas = [bn('0.7872516012227267'), bn('0.5721879593136455'), bn('0.4479412201204208'), bn('0.929563018539273')];

  const movingAverages = [
    bn('338583042824133150'),
    bn('999661784760720100'),
    bn('2950531637919522800000'),
    bn('109863599701288810000000'),
  ];
  //ewma/moving_averages: [109863.59970128881 2950.5316379195228 0.33858304282413315 0.99966178476072010]

  const intermediateValues = [
    bn('305518036416401630'),
    bn('-202962654102146'),
    bn('101101638177726780000'),
    bn('712283057672066850000000'),
  ];

  //running_a / intermediate values: [712283.05767206685  101.10163817772678  0.30551803641640163 -0.00020296265410214614]

  //parameterDescriptions[0] = "Kappa: Kappa dictates the aggressiveness of response to a signal change.";
  //parameterDescriptions[1] = "Width: Width parameter for the mean reversion channel.";
  //parameterDescriptions[2] = "Amplitude: Amplitude of the mean reversion effect.";
  //parameterDescriptions[3] = "Exponents: Exponents for the trend following portion.";
  //parameterDescriptions[4] = "Inverse Scaling: Scaling factor for channel portion. "
  //    "If set to max(exp(-x^2/2)sin(pi*x/3)) [=0.541519...] "
  //    "then the amplitude parameter directly controls the channel height.";
  //parameterDescriptions[5] = "Pre-exp Scaling: Scaling factor before exponentiation in the trend following portion.";
  //parameterDescriptions[6] = "Use raw price: 0 = use moving average, 1 = use raw price for denominator of price gradient.";

  const parameters = [
    [bn('593900773823135980000'), bn('93130867147542816000'), bn('89055850228512313000'), bn('2601959372357041000000')], //kappa
    [bn('16622246139525294'), bn('903593235016048'), bn('10606898165675289'), bn('8638844105105422')], //width
    [bn('11037321655782598'), bn('903593235016047'), bn('2762835127905918'), bn('74853775497883593')], //amplitude
    [bn('844348984064979400'), bn('1068631815808947200'), bn('2355880196865995000'), bn('783203891197999300')], //exponents
    [bn('541500000000000000'), bn('541500000000000000'), bn('541500000000000000'), bn('541500000000000000')], //inverse scaling factor
    [bn('297027682894500'), bn('1573133109866300'), bn('223865496705500'), bn('201549309314500')], //Pre-exp Scaling
    [bn('0')], //Use Raw Price
  ];

  //const parameters = [
  //[bn('2601.9593723570410'), bn('89.055850228512313'), bn('593.90077382313598'), bn('93.130867147542816')], //kappa
  //[bn('0.7832038911979993'), bn('2.3558801968659950'), bn('0.8443489840649794'), bn('1.0686318158089472')], //exponents
  //[bn('0.0086388441051054223'), bn('0.010606898165675289'), bn('0.016622246139525294'), bn('0.00090359323501604781')], //width
  //[bn('0.074853775497883593'), bn('0.0027628351279059180'), bn('0.011037321655782598'), bn('0.07.2324601375887462')], //amplitude
  //[bn('0.0002015493093145'), bn('0.0002238654967055'), bn('0.0002970276828945'), bn('0.0015731331098663')], //Pre-exp Scaling
  //[bn('0')], //Use Raw Price
  //];

  //again this is in InputHelper.sortTokens order
  const oracles = [
    [sonicOracle], // SONIC
    [usdcOracle], // USDC
    [ethOracle], // eth
    [btcOracle], // WBTC
  ];

  const normalizedWeights = [
    bn('030000000000000000'),
    bn('030000000000000000'),
    bn('910000000000000000'),
    bn('030000000000000000'),
  ];
  //const normalizedWeights = [bn('0.439096623000000000'), bn('0.462022194000000000'), fp('0.098881183000000000')];
  const intNormalizedWeights = [...normalizedWeights];

  const poolDetails = [
    ['overview', 'adaptabilityScore', 'number', '5'],
    ['ruleDetails', 'updateRuleName', 'string', 'Channel Following'],
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
    name: 'SONIC MACRO BTF',
    symbol: 'SONIC-MACRO-BTF',
    tokens: tokenConfig,
    normalizedWeights,
    roleAccounts: {
      pauseManager: ZERO_ADDRESS,
      swapFeeManager: ZERO_ADDRESS,
      poolCreator: ZERO_ADDRESS,
    },
    swapFeePercentage: fp(0.005),
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
