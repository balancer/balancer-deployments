import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { createPoolParams, CreationNewPoolParams, QuantAMMDeploymentInputParams } from '../input';

describeForkTest('QuantAMMPool', 'mainnet', 21818600, function () {
  let task: Task;
  let factory: Contract, pool: Contract;
  let input: QuantAMMDeploymentInputParams;
  let params: CreationNewPoolParams;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  let accounts: string[];
  let sender: string;

  const TASK_NAME = '20250313-v3-quantamm';
  const POOL_CONTRACT_NAME = 'QuantAMMWeightedPool';
  const FACTORY_CONTRACT_NAME = POOL_CONTRACT_NAME + 'Factory';

  before('run task', async () => {
    accounts = (await hre.ethers.getSigners()) as unknown as string[];
    sender = accounts[0];
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    factory = await task.deployedInstance(FACTORY_CONTRACT_NAME);
  });

  before('setup contracts and parameters', async () => {
    const chainlinkBtcOracleWrapper: Contract = await task.deployedInstance('ChainlinkBtcOracle');
    const chainlinkUsdcOracleWrapper: Contract = await task.deployedInstance('ChainlinkUsdcOracle');
    const antiMomentumUpdateRule: Contract = await task.deployedInstance('AntimomentumUpdateRule');

    input = task.input() as QuantAMMDeploymentInputParams;

    params = await createPoolParams(
      input.USDC,
      chainlinkUsdcOracleWrapper.address,
      input.WBTC,
      chainlinkBtcOracleWrapper.address,
      antiMomentumUpdateRule.address
    );
  });

  it('deploys pool', async () => {
    params.name = 'DO NOT USE TEST QuantAMM POOL';
    params.symbol = 'TEST';
    const poolCreationReceipt = await (await factory.connect(sender).create(params, input.Vault)).wait();

    const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
    pool = await task.instanceAt(POOL_CONTRACT_NAME, event.args.pool);
  });

  it('checks pool tokens', async () => {
    const poolTokens = (await pool.getTokens()).map((token: string) => token.toLowerCase());
    expect(poolTokens).to.be.deep.eq(params.tokens.map((config) => config.token.toLowerCase()));
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

  it('checks initial pool settings', async () => {
    expect(await pool.quantammAdmin()).to.be.eq(sender);
    expect(await pool.poolSettings()).to.be.deep.eq(params.poolSettings);
    expect(await pool.lambda()).to.be.deep.eq(params.poolSettings.lambda);
    expect(await pool.epsilonMax()).to.be.eq(params.poolSettings.epsilonMax);
    expect(await pool.absoluteWeightGuardRail()).to.be.eq(params.poolSettings.absoluteWeightGuardRail);
    expect(await pool.updateInterval()).to.be.eq(params.poolSettings.updateInterval);
    expect(await pool.poolRegistry()).to.be.eq(params.poolRegistry);
  });
});
