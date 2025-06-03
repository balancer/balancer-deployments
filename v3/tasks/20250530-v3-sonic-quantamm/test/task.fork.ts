import hre from 'hardhat';
import { expect } from 'chai';
import { Contract, ethers } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { createPoolParams, CreationNewPoolParams, QuantAMMDeploymentInputParams } from '../input';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describeForkTest('QuantAMMPool', 'sepolia', 8140847, function () {
  let task: Task;
  let factory: Contract, pool: Contract, rule: Contract, updateWeightRunner: Contract;
  let input: QuantAMMDeploymentInputParams;
  let params: CreationNewPoolParams;

  let accounts: SignerWithAddress[];
  let sender: SignerWithAddress;

  const TASK_NAME = '20250530-v3-sonic-quantamm';
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
    const powerChannelRule: Contract = await task.deployedInstance('PowerChannelUpdateRule');
    rule = powerChannelRule;
    const updateWeightRunnerTask = new Task(
      '20250419-v3-update-weight-runner',
      TaskMode.READ_ONLY,
      getForkedNetwork(hre)
    );
    updateWeightRunner = await updateWeightRunnerTask.deployedInstance('UpdateWeightRunner');
    input = task.input() as QuantAMMDeploymentInputParams;

    //this will have to be done manually by the mutlisig admin prior to pool creation.
    await updateWeightRunner.addOracle(input.ChainlinkDataFeedBTC);
    await updateWeightRunner.addOracle(input.ChainlinkDataFeedUSDC);
    await updateWeightRunner.addOracle(input.ChainlinkFeedETH);
    await updateWeightRunner.addOracle(input.ChainlinkDataFeedSONIC);

    const salt = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(['address', 'uint256'], [sender.address, Math.floor(Date.now() / 1000)])
    );

    params = await createPoolParams(
      input.WBTC,
      input.ChainlinkDataFeedBTC,
      input.SONIC,
      input.ChainlinkDataFeedSONIC,
      input.ETH,
      input.ChainlinkFeedETH,
      input.USDC,
      input.ChainlinkDataFeedUSDC,
      powerChannelRule.address,
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

  it('checks initial pool immutable settings', async () => {
    expect(await pool.lambda(0)).to.be.deep.eq(params._poolSettings.lambda[0]);
    expect(await pool.epsilonMax()).to.be.eq(params._poolSettings.epsilonMax);
    expect(await pool.absoluteWeightGuardRail()).to.be.eq(params._poolSettings.absoluteWeightGuardRail);
    expect(await pool.updateInterval()).to.be.eq(params._poolSettings.updateInterval);
    expect(await pool.poolRegistry()).to.be.eq(params.poolRegistry);
  });

  it('checks initial pool dynamic settings', async () => {
    expect(await pool.lambda(0)).to.be.deep.eq(params._poolSettings.lambda[0]);
    expect(await pool.epsilonMax()).to.be.eq(params._poolSettings.epsilonMax);
    expect(await pool.absoluteWeightGuardRail()).to.be.eq(params._poolSettings.absoluteWeightGuardRail);
    expect(await pool.updateInterval()).to.be.eq(params._poolSettings.updateInterval);
    expect(await pool.poolRegistry()).to.be.eq(params.poolRegistry);
  });

  it('checks initial pool intermediate values', async () => {
    const n = 3;
    const expected = params._initialIntermediateValues;

    const gradState = await rule.getIntermediateGradientState(pool.address, n);

    expect(gradState.length).to.be.eq(n);

    for (let i = 0; i < n; ++i) {
      expect(gradState[i]).to.be.deep.eq(expected[i], `mismatch at index ${i}`);
    }
  });

  it('checks initial pool moving average values', async () => {
    const n = 3;

    const expected = params._initialMovingAverages;

    const movingAvgs = await rule.getMovingAverages(pool.address, n);

    expect(movingAvgs.length).to.be.eq(n);

    for (let i = 0; i < n; ++i) {
      expect(movingAvgs[i]).to.be.deep.eq(expected[i], `mismatch at index ${i}`);
    }
  });

  it('checks update weight runner pool rule registration', async () => {
    expect(await updateWeightRunner.rules(pool.address)).to.be.eq(params._poolSettings.rule, 'wrong rule address');

    const settings = await updateWeightRunner.poolRuleSettings(pool.address);

    // ABI does not include lambda getter

    //expect(settings.lambda.length).to.be.eq(params._poolSettings.lambda.length, 'lambda length mismatch');
    //for (let i = 0; i < settings.lambda.length; i++) {
    //  expect(settings.lambda[i]).to.be.deep.eq(params._poolSettings.lambda[i], `lambda[${i}] mismatch`);
    //}

    expect(settings.epsilonMax).to.be.eq(params._poolSettings.epsilonMax, 'epsilonMax mismatch');
    expect(settings.absoluteWeightGuardRail).to.be.eq(
      params._poolSettings.absoluteWeightGuardRail,
      'absoluteWeightGuardRail mismatch'
    );

    // ruleParameters is not included in the ABI
    //expect(settings.ruleParameters.length).to.be.eq(
    //  params._poolSettings.ruleParameters.length,
    //  'ruleParameters length mismatch'
    //);
    //for (let i = 0; i < settings.ruleParameters.length; i++) {
    //  expect(settings.ruleParameters[i]).to.be.deep.eq(
    //    params._poolSettings.ruleParameters[i],
    //    `ruleParameters[${i}] mismatch`
    //  );
    //}

    expect(settings.timingSettings.updateInterval).to.be.eq(
      params._poolSettings.updateInterval,
      'updateInterval mismatch'
    );

    expect(settings.timingSettings.lastPoolUpdateRun).to.be.eq(0, 'lastPoolUpdateRun should start at 0');

    expect(settings.poolManager).to.be.eq(params._poolSettings.poolManager, 'poolManager mismatch');
  });

  it('checks pool oracle registration', async () => {
    const expected = params._poolSettings.oracles.map((oracleArray) =>
      oracleArray.map((oracle) => oracle.toLowerCase())
    );

    // single call to fetch the registered oracle array
    // per‑index deep equality check
    for (let i = 0; i < expected.length; i++) {
      const registeredOracles = await updateWeightRunner.poolOracles(pool.address, i);
      expect(registeredOracles.toLowerCase()).to.be.eq(expected[i][0], `oracle at index ${i} mismatch`);
    }
  });
});
