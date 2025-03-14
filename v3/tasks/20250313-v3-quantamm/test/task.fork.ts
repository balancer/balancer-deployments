import hre from 'hardhat';
import { expect } from 'chai';
import { Contract, ethers } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { createPoolParams, CreationNewPoolParams, QuantAMMDeploymentInputParams } from '../input';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describeForkTest('QuantAMMPool', 'sepolia', 7894343, function () {
  let task: Task;
  let factory: Contract, pool: Contract;
  let input: QuantAMMDeploymentInputParams;
  let params: CreationNewPoolParams;

  let accounts: SignerWithAddress[];
  let sender: SignerWithAddress;

  const TASK_NAME = '20250313-v3-quantamm';
  const POOL_CONTRACT_NAME = 'QuantAMMWeightedPool';
  const FACTORY_CONTRACT_NAME = POOL_CONTRACT_NAME + 'Factory';

  before('run task', async () => {
    accounts = await hre.ethers.getSigners();
    sender = accounts[0];
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    factory = await task.deployedInstance(FACTORY_CONTRACT_NAME);
  });

  before('setup contracts and parameters', async () => {
    const chainlinkBtcOracleWrapper: Contract = await task.instanceAt(
      'ChainlinkOracle',
      task.output().ChainlinkBtcOracle
    );
    const chainlinkUsdcOracleWrapper: Contract = await task.instanceAt(
      'ChainlinkOracle',
      task.output().ChainlinkUsdcOracle
    );

    const antiMomentumUpdateRule: Contract = await task.deployedInstance('AntiMomentumUpdateRule');
    const updateWeightRunner = await task.deployedInstance('UpdateWeightRunner');

    await updateWeightRunner.addOracle(chainlinkBtcOracleWrapper.address);
    await updateWeightRunner.addOracle(chainlinkUsdcOracleWrapper.address);

    input = task.input() as QuantAMMDeploymentInputParams;

    const salt = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(['address', 'uint256'], [sender.address, Math.floor(Date.now() / 1000)])
    );

    params = await createPoolParams(
      input.USDC,
      chainlinkUsdcOracleWrapper.address,
      input.WBTC,
      chainlinkBtcOracleWrapper.address,
      antiMomentumUpdateRule.address,
      salt,
      sender.address
    );
  });

  it('deploys pool', async () => {
    params.name = 'DO NOT USE TEST QuantAMM POOL';
    params.symbol = 'TEST';

    const poolCreationReceipt = await (await factory.connect(sender).create(params)).wait();
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
    expect(await pool.lambda(0)).to.be.deep.eq(params._poolSettings.lambda[0]);
    expect(await pool.epsilonMax()).to.be.eq(params._poolSettings.epsilonMax);
    expect(await pool.absoluteWeightGuardRail()).to.be.eq(params._poolSettings.absoluteWeightGuardRail);
    expect(await pool.updateInterval()).to.be.eq(params._poolSettings.updateInterval);
    expect(await pool.poolRegistry()).to.be.eq(params.poolRegistry);
  });
});
