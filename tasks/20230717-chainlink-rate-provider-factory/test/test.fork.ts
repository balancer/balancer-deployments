import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { ZERO_ADDRESS } from '@helpers/constants';
import { fp } from '@helpers/numbers';

describeForkTest('ChainlinkRateProviderFactory', 'mainnet', 17717232, function () {
  let task: Task;
  let usdcPriceFeed: Contract, rateProviderFactory: Contract, rateProvider: Contract;
  const usdcPriceFeedAddress = '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6';

  before('run task', async () => {
    task = new Task('20230717-chainlink-rate-provider-factory', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    usdcPriceFeed = await task.instanceAt('AggregatorV3Interface', usdcPriceFeedAddress);
    rateProviderFactory = await task.deployedInstance('ChainlinkRateProviderFactory');
  });

  before('create a ChainLinkRateProvider', async () => {
    const receipt = await (await rateProviderFactory.create(usdcPriceFeed.address)).wait();
    const event = await expectEvent.inReceipt(receipt, 'RateProviderCreated');

    rateProvider = await task.instanceAt('ChainlinkRateProvider', event.args.rateProvider);

    expect(rateProvider.address).to.not.equal(ZERO_ADDRESS);
    expect(await rateProviderFactory.isRateProviderFromFactory(rateProvider.address)).to.be.true;
  });

  it('rate is about 1 USD per USDC', async () => {
    expect(await rateProvider.getRate()).to.almostEqual(fp(1));
  });
});
