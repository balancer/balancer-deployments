import hre from 'hardhat';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import { fpMul, fromFp } from '@helpers/numbers';
import { expect } from 'chai';
import { ZERO_ADDRESS } from '@helpers/constants';

describeForkTest('WeightedLPOracle', 'base', 34240741, function () {
  let task: Task;
  let weightedLPOracleFactory: Contract, weightedLPOracle: Contract;
  let poolToken: Contract;

  const WEIGHTED_POOL_ADDRESS = '0x4fbb7870dbe7a7ef4866a33c0eed73d395730dc0';

  const ETH_FEED_ADDRESS = '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70';
  const USDC_FEED_ADDRESS = '0x7e860098F58bBFC8648a4311b374B1D669a2bc6B';

  before('run task', async () => {
    task = new Task('20250814-v3-weighted-pool-oracle', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    weightedLPOracleFactory = await task.deployedInstance('WeightedLPOracleFactory');
  });

  before('setup contracts and addresses', async () => {
    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    poolToken = await vaultTask.instanceAt('IERC20', WEIGHTED_POOL_ADDRESS);
  });

  it('checks version', async () => {
    const factoryVersion = JSON.parse(await weightedLPOracleFactory.version());
    expect(factoryVersion.deployment).to.be.eq(task.id);
    expect(factoryVersion.name).to.be.eq('WeightedLPOracleFactory');
    expect(factoryVersion.version).to.be.eq(0);
  });

  it('create oracle', async () => {
    // Feeds are ordered according to the token order registered in the pool.
    const tx = await weightedLPOracleFactory.create(WEIGHTED_POOL_ADDRESS, [USDC_FEED_ADDRESS, ETH_FEED_ADDRESS]);

    const receipt = await tx.wait();
    const event = receipt.events?.find((e: { event: string }) => e.event === 'WeightedLPOracleCreated');
    weightedLPOracle = await task.instanceAt('WeightedLPOracle', event?.args?.oracle);
    expect(weightedLPOracle).to.not.be.undefined;
    expect(weightedLPOracle).to.not.be.eq(ZERO_ADDRESS);
  });

  it('checks price feeds', async () => {
    const priceFeeds = await weightedLPOracle.getFeeds();
    expect(priceFeeds[0]).to.be.eq(USDC_FEED_ADDRESS);
    expect(priceFeeds[1]).to.be.eq(ETH_FEED_ADDRESS);
  });

  it('checks prices', async () => {
    const { prices } = await weightedLPOracle.getFeedData();
    expect(fromFp(prices[0])).to.be.equalWithError(0.999);
    expect(fromFp(prices[1])).to.be.equalWithError(4491);
  });

  it('gets TVL measured in USD', async () => {
    const { answer } = await weightedLPOracle.latestRoundData();
    const totalSupply = await poolToken.totalSupply();
    // This is the TVL in USD at the current block.
    expect(fromFp(fpMul(answer, totalSupply))).to.be.equalWithError(103519);
  });
});
