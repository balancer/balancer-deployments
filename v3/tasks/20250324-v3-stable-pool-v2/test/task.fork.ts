import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, getSigner, Task, TaskMode } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { ONES_BYTES32, ZERO_ADDRESS } from '@helpers/constants';
import { bn, fp } from '@helpers/numbers';
import { StablePoolDeployment } from '../input';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { currentTimestamp, DAY } from '@helpers/time';

describeForkTest('V3-StablePool-V2', 'mainnet', 22069200, function () {
  let task: Task;
  let factory: Contract, pool: Contract;
  let input: StablePoolDeployment;
  let admin: SignerWithAddress;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenConfig: any[];

  const TASK_NAME = '20250324-v3-stable-pool-v2';
  const POOL_CONTRACT_NAME = 'StablePool';
  const FACTORY_CONTRACT_NAME = POOL_CONTRACT_NAME + 'Factory';
  const LARGE_AMP = 6000;

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    factory = await task.deployedInstance(FACTORY_CONTRACT_NAME);
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

    admin = await getSigner(0);
  });

  it('deploys pool', async () => {
    const newStablePoolParams = {
      name: 'Mock Stable Pool',
      symbol: 'TEST',
      tokens: tokenConfig,
      amplificationParameter: bn(1000),
      roleAccounts: {
        pauseManager: ZERO_ADDRESS,
        swapFeeManager: admin.address, // Set swap fee manager
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
    pool = await task.instanceAt(POOL_CONTRACT_NAME, event.args.pool);
  });

  it('checks pool tokens', async () => {
    const poolTokens = (await pool.getTokens()).map((token: string) => token.toLowerCase());
    expect(poolTokens).to.be.deep.eq(tokenConfig.map((config) => config.token.toLowerCase()));
  });

  it('checks pool version', async () => {
    const version = JSON.parse(await pool.version());
    expect(version.deployment).to.be.eq(TASK_NAME);
    expect(version.version).to.be.eq(2);
    expect(version.name).to.be.eq(POOL_CONTRACT_NAME);
  });

  it('checks factory version', async () => {
    const version = JSON.parse(await factory.version());
    expect(version.deployment).to.be.eq(TASK_NAME);
    expect(version.version).to.be.eq(2);
    expect(version.name).to.be.eq(FACTORY_CONTRACT_NAME);
  });

  it('swap fee manager can set amp factor above 5k', async () => {
    const endTime = (await currentTimestamp()).add(4 * DAY);

    await pool.connect(admin).startAmplificationParameterUpdate(LARGE_AMP, endTime);

    const { isUpdating } = await pool.getAmplificationParameter();
    expect(isUpdating).to.be.true;
  });
});
