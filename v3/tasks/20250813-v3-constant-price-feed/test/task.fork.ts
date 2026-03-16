import hre from 'hardhat';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import { fp } from '@helpers/numbers';
import { expect } from 'chai';
import { currentTimestamp } from '@helpers/time';

describeForkTest('ConstantPriceFeed', 'mainnet', 23177700, function () {
  let task: Task;
  let constantPriceFeed: Contract;

  before('run task', async () => {
    task = new Task('20250813-v3-constant-price-feed', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    constantPriceFeed = await task.deployedInstance('ConstantPriceFeed');
  });

  it('returns a constant price', async () => {
    const data = await constantPriceFeed.latestRoundData();
    expect(data[1]).to.be.eq(fp(1)); // answer
    expect(data[3]).to.be.eq(await currentTimestamp()); // updatedAt
  });
});
