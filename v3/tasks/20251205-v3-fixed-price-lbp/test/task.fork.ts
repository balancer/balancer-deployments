import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { describeForkTest, getForkedNetwork, impersonate, Task, TaskMode } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';
import { fp, maxUint } from '@helpers/numbers';
import { advanceTime, currentTimestamp, DAY, HOUR } from '@helpers/time';

describeForkTest('V3-FixedPriceLBPool', 'mainnet', 23929800, function () {
  const TASK_NAME = '20251205-v3-fixed-price-lbp';
  const POOL_CONTRACT_NAME = 'FixedPriceLBPool';
  const FACTORY_CONTRACT_NAME = POOL_CONTRACT_NAME + 'Factory';
  const VERSION_NUM = 1;

  const SWAP_FEE = fp(0.01);

  const TEST_BAL_ADMIN = '0x9098b50ee2d9E4c3C69928A691DA3b192b4C9673';

  const INITIAL_BAL = fp(26667);
  const INITIAL_WETH = 0;

  const PROJECT_TOKEN_RATE = fp(3000);

  let factory: Contract, pool: Contract;
  let trustedRouter: Contract;
  let bal: Contract, weth: Contract;
  let permit2: Contract;
  let task: Task;
  let admin: SignerWithAddress;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenConfig: any[];

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    factory = await task.deployedInstance(FACTORY_CONTRACT_NAME);

    const routerTask = new Task('20250307-v3-router-v2', TaskMode.READ_ONLY, getForkedNetwork(hre));
    trustedRouter = await routerTask.deployedInstance('Router');

    const permit2Task = new Task('00000000-permit2', TaskMode.READ_ONLY);
    const permit2Address = permit2Task.output({ network: 'mainnet' }).Permit2;
    permit2 = await task.instanceAt('IPermit2', permit2Address);

    admin = await impersonate(TEST_BAL_ADMIN, fp(10e8));

    const tokensTask = new Task('00000000-tokens', TaskMode.READ_ONLY);
    const testBALTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));

    const fork = getForkedNetwork(hre);

    const WETH = tokensTask.output({ network: fork }).WETH;

    bal = await testBALTokenTask.deployedInstance('TestBalancerToken');
    weth = await task.instanceAt('IERC20', WETH);
  });

  before('setup contracts and parameters', async () => {
    tokenConfig = [
      {
        token: weth.address,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
      {
        token: bal.address,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
    ].sort(function (a, b) {
      return a.token.toLowerCase().localeCompare(b.token.toLowerCase());
    });
  });

  it('has trusted router', async () => {
    expect(await factory.getTrustedRouter()).to.eq(trustedRouter.address);
  });

  it('deploys FixedPriceLBP', async () => {
    const startTime = await currentTimestamp();

    const fixedLBPParams = {
      name: 'Mock LBP',
      symbol: 'FixedLBP-TEST',
      owner: admin.address,
      projectToken: bal.address,
      reserveToken: weth.address,
      startTime: startTime.add(HOUR),
      endTime: startTime.add(DAY),
      blockProjectTokenSwapsIn: true,
    };

    const poolCreationReceipt = await (
      await factory.create(
        fixedLBPParams,
        PROJECT_TOKEN_RATE,
        SWAP_FEE,
        ZERO_BYTES32, // salt
        ZERO_ADDRESS // pool creator
      )
    ).wait();

    const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
    pool = await task.instanceAt(POOL_CONTRACT_NAME, event.args.pool);
  });

  it('checks pool tokens', async () => {
    const poolTokens = (await pool.getTokens()).map((token: string) => token.toLowerCase());
    expect(poolTokens).to.be.deep.eq(tokenConfig.map((config) => config.token.toLowerCase()));

    expect(await pool.getProjectToken()).to.eq(bal.address);
    expect(await pool.getReserveToken()).to.eq(weth.address);
  });

  it('checks pool version', async () => {
    const version = JSON.parse(await pool.version());
    expect(version.deployment).to.be.eq(TASK_NAME);
    expect(version.version).to.be.eq(VERSION_NUM);
    expect(version.name).to.be.eq(POOL_CONTRACT_NAME);
  });

  it('checks factory version', async () => {
    const version = JSON.parse(await factory.version());
    expect(version.deployment).to.be.eq(TASK_NAME);
    expect(version.version).to.be.eq(VERSION_NUM);
    expect(version.name).to.be.eq(FACTORY_CONTRACT_NAME);
  });

  it('sale has not started yet', async () => {
    expect(await pool.isSwapEnabled()).to.be.false;
  });

  it('initializes the pool', async () => {
    // Give the admin tokens: mint test tokens, get WETH
    await bal.connect(admin).mint(admin.address, INITIAL_BAL);

    await bal.connect(admin).approve(permit2.address, INITIAL_BAL);
    await permit2.connect(admin).approve(bal.address, trustedRouter.address, INITIAL_BAL, maxUint(48));

    await trustedRouter.connect(admin).initialize(
      pool.address,
      [bal.address, weth.address],
      [INITIAL_BAL, INITIAL_WETH],
      0,
      false, // wethIsETH
      ZERO_BYTES32
    );
  });

  it('starts the sale', async () => {
    await advanceTime(2 * HOUR);

    expect(await pool.isSwapEnabled()).to.be.true;
  });

  it('ends the sale', async () => {
    await advanceTime(DAY);

    expect(await pool.isSwapEnabled()).to.be.false;
  });
});
