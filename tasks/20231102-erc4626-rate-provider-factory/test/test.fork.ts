import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { ZERO_ADDRESS } from '@helpers/constants';
import { fp } from '@helpers/numbers';

describeForkTest('ERC4626RateProviderFactory', 'mainnet', 18380714, function () {
  let task: Task;
  let erc4626: Contract, rateProviderFactory: Contract, rateProvider: Contract;
  
  let sFraxErc4626Address = '0xA663B02CF0a4b149d2aD41910CB81e23e1c41c32';

  before('run task', async () => {
    task = new Task('20231102-erc4626-rate-provider-factory', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    erc4626 = await task.instanceAt('IERC4626', sFraxErc4626Address);

    rateProviderFactory = await task.deployedInstance('ERC4626RateProviderFactory');
  });

  before('create a ERC4626RateProvider', async () => {
    const receipt = await (await rateProviderFactory.create(erc4626.address)).wait();
    const event = await expectEvent.inReceipt(receipt, 'RateProviderCreated');

    rateProvider = await task.instanceAt('ERC4626RateProvider', event.args.rateProvider);

    expect(rateProvider.address).to.not.equal(ZERO_ADDRESS);
    expect(await rateProviderFactory.isRateProviderFromFactory(rateProvider.address)).to.be.true;
  });

  it('rate is about 1', async () => {
    expect(await rateProvider.getRate()).to.almostEqual(fp(1));
  });
});
