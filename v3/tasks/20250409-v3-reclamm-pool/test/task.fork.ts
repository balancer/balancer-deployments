import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { ONES_BYTES32, ZERO_ADDRESS } from '@helpers/constants';
import { ReClammPoolDeployment } from '../input';
import { bn, fp } from '@helpers/numbers';

describeForkTest('V3-ReClammPool', 'mainnet', 22590000, function () {
  const TASK_NAME = '20250409-v3-reclamm-pool';
  const POOL_CONTRACT_NAME = 'ReClammPool';
  const FACTORY_CONTRACT_NAME = POOL_CONTRACT_NAME + 'Factory';

  const DAILY_PRICE_SHIFT_EXPONENT = bn(100e16); // 100%
  const CENTEREDNESS_MARGIN = bn(20e16); // 20%
  const INITIAL_MIN_PRICE = fp(1000);
  const INITIAL_MAX_PRICE = fp(4000);
  const INITIAL_TARGET_PRICE = fp(2500);

  const SWAP_FEE_PERCENTAGE = bn(1e16); // 1%
  const BAL_TOKEN = '0xba100000625a3754423978a60c9317c58a424e3D';

  let task: Task;
  let factory: Contract, pool: Contract;
  let input: ReClammPoolDeployment;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenConfig: any[];

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    factory = await task.deployedInstance(FACTORY_CONTRACT_NAME);
  });

  before('setup contracts and parameters', async () => {
    input = task.input() as ReClammPoolDeployment;
    tokenConfig = [
      {
        token: input.WETH,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
      {
        token: BAL_TOKEN,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
    ].sort(function (a, b) {
      return a.token.toLowerCase().localeCompare(b.token.toLowerCase());
    });
  });

  it('deploys pool', async () => {
    const priceParams = {
      initialMinPrice: INITIAL_MIN_PRICE,
      initialMaxPrice: INITIAL_MAX_PRICE,
      initialTargetPrice: INITIAL_TARGET_PRICE,
      tokenAPriceIncludesRate: false,
      tokenBPriceIncludesRate: false,
    };

    const poolCreationReceipt = await (
      await factory.create(
        'Mock ReClamm Pool',
        'TEST',
        tokenConfig,
        {
          pauseManager: ZERO_ADDRESS,
          swapFeeManager: ZERO_ADDRESS,
          poolCreator: ZERO_ADDRESS,
        },
        SWAP_FEE_PERCENTAGE,
        priceParams,
        DAILY_PRICE_SHIFT_EXPONENT,
        CENTEREDNESS_MARGIN,
        ONES_BYTES32
      )
    ).wait();

    const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
    pool = await task.instanceAt(POOL_CONTRACT_NAME, event.args.pool);
  });

  it('checks pool tokens', async () => {
    const poolTokens = (await pool.getTokens()).map((token: string) => token.toLowerCase());
    expect(poolTokens).to.be.deep.eq(tokenConfig.map((config) => config.token.toLowerCase()));
  });

  it('checks pool version', async () => {
    const version = JSON.parse(await pool.version());
    expect(version.deployment).to.be.eq(TASK_NAME);
    expect(version.version).to.be.eq(1);
    expect(version.name).to.be.eq(POOL_CONTRACT_NAME);
  });

  it('checks factory version', async () => {
    const version = JSON.parse(await factory.version());
    expect(version.deployment).to.be.eq(TASK_NAME);
    expect(version.version).to.be.eq(1);
    expect(version.name).to.be.eq(FACTORY_CONTRACT_NAME);
  });
});
