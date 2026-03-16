import hre from 'hardhat';
import { expect } from 'chai';
import { describeForkTest, getForkedNetwork, impersonate, Task, TaskMode } from '@src';
import { BigNumber, Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { bn, fp } from '@helpers/numbers';
import { ZERO_ADDRESS } from '@helpers/constants';
import { currentTimestamp, DAY } from '@helpers/time';

describeForkTest('AggregatorRouter-V3', 'mainnet', 21880900, function () {
  let task: Task;
  let aggregatorRouter: Contract;
  let pool: Contract;
  let rsEthWhale: SignerWithAddress, zero: SignerWithAddress;
  let rsETH: Contract, hgETH: Contract;

  // Using a vanilla pool for simplicity.
  const RSETH_HGETH_POOL = '0x6649a010cbcf5742e7a13a657df358556b3e55cf';
  const RSETH_ADDRESS = '0xa1290d69c65a6fe4df752f95823fae25cb99e5a7';
  const HGETH_ADDRESS = '0xc824a08db624942c5e5f330d56530cd1598859fd';
  const RSETH_WHALE = '0x43594da5d6a03b2137a04df5685805c676def7cb';

  const versionNumber = 1;
  const deploymentId = '20250218-v3-aggregator-router';

  before('run task', async () => {
    task = new Task(deploymentId, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    aggregatorRouter = await task.deployedInstance('AggregatorRouter');

    const testTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));

    rsETH = await testTokenTask.instanceAt('TestBalancerToken', RSETH_ADDRESS);
    hgETH = await testTokenTask.instanceAt('TestBalancerToken', HGETH_ADDRESS);

    rsEthWhale = await impersonate(RSETH_WHALE, fp(10));
    zero = await impersonate(ZERO_ADDRESS, fp(10));
  });

  before('gets pool contract', async () => {
    const stablePoolTask = new Task('20241205-v3-stable-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    pool = await stablePoolTask.instanceAt('StablePool', RSETH_HGETH_POOL);
  });

  it('checks router version', async () => {
    const routerVersion = JSON.parse(await aggregatorRouter.version());
    expect(routerVersion.name).to.be.eq('AggregatorRouter');
    expect(routerVersion.version).to.be.eq(versionNumber);
    expect(routerVersion.deployment).to.be.eq(deploymentId);
  });

  it('performs swap', async () => {
    const rplAmountIn = fp(1);
    // Query result
    const expectedAmountOut = await aggregatorRouter
      .connect(zero)
      .callStatic.querySwapSingleTokenExactIn(
        pool.address,
        RSETH_ADDRESS,
        HGETH_ADDRESS,
        rplAmountIn,
        rsEthWhale.address,
        '0x'
      );

    const hgEthBalanceBefore: BigNumber = await hgETH.balanceOf(rsEthWhale.address);

    // Pay token in upfront and swap
    await rsETH.connect(rsEthWhale).transfer(await aggregatorRouter.getVault(), rplAmountIn);
    await aggregatorRouter
      .connect(rsEthWhale)
      .swapSingleTokenExactIn(
        pool.address,
        RSETH_ADDRESS,
        HGETH_ADDRESS,
        rplAmountIn,
        expectedAmountOut.sub(1),
        (await currentTimestamp()).add(bn(DAY)),
        '0x'
      );

    const hgEthBalanceAfter: BigNumber = await hgETH.balanceOf(rsEthWhale.address);

    expect(hgEthBalanceAfter).to.be.eq(hgEthBalanceBefore.add(expectedAmountOut));
  });
});
