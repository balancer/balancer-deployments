import { ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';
import { ethers } from 'ethers';
import { bn, fp } from '@helpers/numbers';
import * as expectEvent from '@helpers/expectEvent';

import { saveContractDeploymentTransactionHash } from '@src';
import { Task, TaskMode, TaskRunOptions } from '@src';
import { QuantAMMDeploymentInputParams } from './input';

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

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as QuantAMMDeploymentInputParams;

  const args = [input.Vault, input.PauseWindowDuration, input.FactoryVersion, input.PoolVersion];
  const chainlinkEthOracleWrapper = await task.deployAndVerify('ChainlinkOracle', args, from, force);
  const chainlinkBtcOracleWrapper = await task.deployAndVerify('ChainlinkOracle', args, from, force);
  const chainlinkUsdcOracleWrapper = await task.deployAndVerify('ChainlinkOracle', args, from, force);
  const updateWeightRunner = await task.deployAndVerify('UpdateWeightRunner', args, from, force);

  const antiMomentumUpdateRule = await task.deployAndVerify('AntimomentumUpdateRule', args, from, force);
  const momentumUpdateRule = await task.deployAndVerify('MomentumUpdateRule', args, from, force);
  const powerChannelUpdateRule = await task.deployAndVerify('PowerChannelUpdateRule', args, from, force);
  const channelFollowingUpdateRule = await task.deployAndVerify('ChannelFollowingUpdateRule', args, from, force);
  const differenceMomentumUpdateRule = await task.deployAndVerify('DifferenceMomentumUpdateRule', args, from, force);
  const minimumVarianceUpdateRule = await task.deployAndVerify('MinimumVarianceUpdateRule', args, from, force);
  
  const factory = await task.deployAndVerify('QuantAMMWeightedPoolFactory', args, from, force);

  if (task.mode === TaskMode.LIVE) {
    //rule is registered during pool creation, needs oracles to be valid
    await updateWeightRunner.addOracle(chainlinkEthOracleWrapper.address);
    await updateWeightRunner.addOracle(chainlinkBtcOracleWrapper.address);
    await updateWeightRunner.addOracle(chainlinkUsdcOracleWrapper.address);

    const params = await createPoolParams(
      input.WETH,
      chainlinkUsdcOracleWrapper.address,
      input.BAL,
      chainlinkBtcOracleWrapper.address,
      antiMomentumUpdateRule.address
    );

    // This mimics the logic inside task.deploy
    if (force || !task.output({ ensure: false })['QuantAMMWeightedPool']) {
      const poolCreationReceipt = await (
        await factory.create(
          params
        )
      ).wait();
      const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
      const mockPoolAddress = event.args.pool;

      await saveContractDeploymentTransactionHash(mockPoolAddress, poolCreationReceipt.transactionHash, task.network);
      await task.save({ MockQuantAMMWeightedPool: mockPoolAddress });
    }

    const mockPool = await task.instanceAt('QuantAMMWeightedPool', task.output()['MockQuantAMMWeightedPool']);

    const poolParams = {
      name: params.name,
      symbol: params.symbol,
      numTokens: params.normalizedWeights.length,
      version: await factory.getPoolVersion(),
      updateWeightRunner: updateWeightRunner.address,
      poolRegistry: params.poolRegistry,
      poolDetails: params.poolDetails,
    };

    // We are now ready to verify the Pool
    await task.verify('QuantAMMWeightedPool', mockPool.address, [poolParams, input.Vault]);
  }
};

export async function createPoolParams(usdcAddress:string, usdcOracle:string, wbtcAddress:string, wbtcOracle:string, ruleAddress:string): Promise<any> {
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
