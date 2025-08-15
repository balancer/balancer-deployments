import hre from 'hardhat';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import { fpMul, fromFp } from '@helpers/numbers';
import { expect } from 'chai';
import { ZERO_ADDRESS } from '@helpers/constants';

describeForkTest('StableLPOracle', 'mainnet', 23147505, function () {
  let task: Task;
  let stableLPOracleFactory: Contract, stableLPOracle: Contract;
  let poolToken: Contract;

  const STABLE_POOL_ADDRESS = '0x85B2b559bC2D21104C4DEFdd6EFcA8A20343361D';

  const USDC_PRICE_FEED = '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6';
  const USDT_PRICE_FEED = '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D';
  const GHO_PRICE_FEED = '0x3f12643D3f6f874d39C2a4c9f2Cd6f2DbAC877FC';

  before('run task', async () => {
    task = new Task('20250815-v3-stable-pool-oracle', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    stableLPOracleFactory = await task.deployedInstance('StableLPOracleFactory');
  });

  before('setup contracts and addresses', async () => {
    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    poolToken = await vaultTask.instanceAt('IERC20', STABLE_POOL_ADDRESS);
  });

  it('checks version', async () => {
    const factoryVersion = JSON.parse(await stableLPOracleFactory.version());
    expect(factoryVersion.deployment).to.be.eq(task.id);
    expect(factoryVersion.name).to.be.eq('StableLPOracleFactory');
    expect(factoryVersion.version).to.be.eq(0);
  });

  it('create oracle', async () => {
    // Feeds are ordered according to the token order registered in the pool.
    const tx = await stableLPOracleFactory.create(STABLE_POOL_ADDRESS, [
      USDT_PRICE_FEED,
      GHO_PRICE_FEED,
      USDC_PRICE_FEED,
    ]);

    const receipt = await tx.wait();
    const event = receipt.events?.find((e: { event: string }) => e.event === 'StableLPOracleCreated');
    stableLPOracle = await task.instanceAt('StableLPOracle', event?.args?.oracle);
    expect(stableLPOracle).to.not.be.undefined;
    expect(stableLPOracle).to.not.be.eq(ZERO_ADDRESS);
  });

  it('checks price feeds', async () => {
    const priceFeeds = await stableLPOracle.getFeeds();
    expect(priceFeeds[0]).to.be.eq(USDT_PRICE_FEED);
    expect(priceFeeds[1]).to.be.eq(GHO_PRICE_FEED);
    expect(priceFeeds[2]).to.be.eq(USDC_PRICE_FEED);
  });

  it('checks prices', async () => {
    const { prices } = await stableLPOracle.getFeedData();
    expect(fromFp(prices[0])).to.be.equalWithError(1.0);
    expect(fromFp(prices[1])).to.be.equalWithError(0.999);
    expect(fromFp(prices[2])).to.be.equalWithError(0.999);
  });

  it('gets TVL measured in USD', async () => {
    const { answer } = await stableLPOracle.latestRoundData();
    const totalSupply = await poolToken.totalSupply();
    // This is the TVL in USD at the current block.
    expect(fromFp(fpMul(answer, totalSupply))).to.be.equalWithError(28332842);
  });
});
