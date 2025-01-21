import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { ONES_BYTES32, ZERO_ADDRESS } from '@helpers/constants';
import { fp } from '@helpers/numbers';
import { Gyro2CLPPoolDeployment } from '../input';

describeForkTest('Gyro2CLPPool', 'mainnet', 21668300, function () {
  let task: Task;
  let factory: Contract, pool: Contract;
  let input: Gyro2CLPPoolDeployment;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenConfig: any[];

  before('run task', async () => {
    task = new Task('20250120-v3-gyro-2clp', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    factory = await task.deployedInstance('Gyro2CLPPoolFactory');
  });

  before('setup contracts and parameters', async () => {
    input = task.input() as Gyro2CLPPoolDeployment;
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
    const newGyro2CLPPoolParams = {
      name: 'Mock Gyro Pool',
      symbol: 'TEST',
      tokens: tokenConfig,
      sqrtAlpha: fp(0.8),
      sqrtBeta: fp(1.1),
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
        newGyro2CLPPoolParams.name,
        newGyro2CLPPoolParams.symbol,
        newGyro2CLPPoolParams.tokens,
        newGyro2CLPPoolParams.sqrtAlpha,
        newGyro2CLPPoolParams.sqrtBeta,
        newGyro2CLPPoolParams.roleAccounts,
        newGyro2CLPPoolParams.swapFeePercentage,
        newGyro2CLPPoolParams.hooksAddress,
        newGyro2CLPPoolParams.enableDonations,
        newGyro2CLPPoolParams.disableUnbalancedLiquidity,
        newGyro2CLPPoolParams.salt
      )
    ).wait();

    const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
    pool = await task.instanceAt('Gyro2CLPPool', event.args.pool);
  });

  it('checks pool tokens', async () => {
    const poolTokens = (await pool.getTokens()).map((token: string) => token.toLowerCase());
    expect(poolTokens).to.be.deep.eq(tokenConfig.map((config) => config.token.toLowerCase()));
  });
});
