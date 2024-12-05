import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { ONES_BYTES32, ZERO_ADDRESS } from '@helpers/constants';
import { bn, fp } from '@helpers/numbers';
import { StablePoolDeployment } from '../input';

describeForkTest('StablePool-V3', 'mainnet', 21336200, function () {
  let task: Task;
  let factory: Contract, pool: Contract;
  let input: StablePoolDeployment;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenConfig: any[];

  before('run task', async () => {
    task = new Task('20241205-v3-stable-pool', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    factory = await task.deployedInstance('StablePoolFactory');
  });

  before('setup contracts and parameters', async () => {
    input = task.input() as StablePoolDeployment;
    tokenConfig = [
      {
        token: input.WETH,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
      {
        token: input.BAL,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
    ].sort(function (a, b) {
      return a.token.toLowerCase().localeCompare(b.token.toLowerCase());
    });
  });

  it('deploys pool', async () => {
    const newStablePoolParams = {
      name: 'Mock Stable Pool',
      symbol: 'TEST',
      tokens: tokenConfig,
      amplificationParameter: bn(1000),
      roleAccounts: {
        pauseManager: ZERO_ADDRESS,
        swapFeeManager: ZERO_ADDRESS,
        poolCreator: ZERO_ADDRESS,
      },
      swapFeePercentage: fp(0.01),
      hooksAddress: ZERO_ADDRESS,
      enableDonations: false,
      disableUnbalancedLiquidity: false,
      salt: ONES_BYTES32,
    };

    const poolCreationReceipt = await (
      await factory.create(
        newStablePoolParams.name,
        newStablePoolParams.symbol,
        newStablePoolParams.tokens,
        newStablePoolParams.amplificationParameter,
        newStablePoolParams.roleAccounts,
        newStablePoolParams.swapFeePercentage,
        newStablePoolParams.hooksAddress,
        newStablePoolParams.enableDonations,
        newStablePoolParams.disableUnbalancedLiquidity,
        newStablePoolParams.salt
      )
    ).wait();

    const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
    pool = await task.instanceAt('StablePool', event.args.pool);
  });

  it('checks pool tokens', async () => {
    const poolTokens = (await pool.getTokens()).map((token: string) => token.toLowerCase());
    expect(poolTokens).to.be.deep.eq(tokenConfig.map((config) => config.token.toLowerCase()));
  });
});
