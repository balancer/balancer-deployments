import hre from 'hardhat';
import { expect } from 'chai';
import { describeForkTest, getForkedNetwork, impersonate, Task, TaskMode } from '@src';
import { BigNumber, Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { bn, fp } from '@helpers/numbers';
import { ZERO_ADDRESS } from '@helpers/constants';
import { currentTimestamp, DAY } from '@helpers/time';

describeForkTest.skip('AggregatorBatchRouter-V3', 'mainnet', 21880900, function () {
  let task: Task;
  let aggregatorBatchRouter: Contract;
  let pool: Contract;
  let vault: Contract;
  let rsEthWhale: SignerWithAddress, zero: SignerWithAddress;
  let rsETH: Contract, hgETH: Contract;

  // Using a vanilla pool for simplicity.
  const RSETH_HGETH_POOL = '0x6649a010cbcf5742e7a13a657df358556b3e55cf';
  const RSETH_ADDRESS = '0xa1290d69c65a6fe4df752f95823fae25cb99e5a7';
  const HGETH_ADDRESS = '0xc824A08dB624942c5E5F330d56530cD1598859fD';
  const RSETH_WHALE = '0x43594da5d6a03b2137a04df5685805c676def7cb';

  const versionNumber = 1;
  const deploymentId = '20250507-v3-aggregator-batch-router';

  before('run task', async () => {
    task = new Task(deploymentId, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    aggregatorBatchRouter = await task.deployedInstance('AggregatorBatchRouter');

    const testTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));

    rsETH = await testTokenTask.instanceAt('TestBalancerToken', RSETH_ADDRESS);
    hgETH = await testTokenTask.instanceAt('TestBalancerToken', HGETH_ADDRESS);

    rsEthWhale = await impersonate(RSETH_WHALE, fp(10));
    zero = await impersonate(ZERO_ADDRESS, fp(10));
  });

  before('gets Vault and pool contract', async () => {
    const stablePoolTask = new Task('20241205-v3-stable-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    pool = await stablePoolTask.instanceAt('StablePool', RSETH_HGETH_POOL);

    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
  });

  it('checks router version', async () => {
    const routerVersion = JSON.parse(await aggregatorBatchRouter.version());
    expect(routerVersion.name).to.be.eq('AggregatorBatchRouter');
    expect(routerVersion.version).to.be.eq(versionNumber);
    expect(routerVersion.deployment).to.be.eq(deploymentId);
  });

  it('performs swap', async () => {
    const rplAmountIn = fp(1);

    const pathsExactIn = [
      {
        tokenIn: RSETH_ADDRESS,
        steps: [{ pool: pool.address, tokenOut: HGETH_ADDRESS, isBuffer: false }],
        exactAmountIn: rplAmountIn,
        minAmountOut: rplAmountIn,
      },
    ];

    const queryResult = await aggregatorBatchRouter
      .connect(zero)
      .callStatic.querySwapExactIn(pathsExactIn, rsEthWhale.address, '0x');

    expect(queryResult.tokensOut[0]).to.eq(HGETH_ADDRESS);
    expect(queryResult.pathAmountsOut[0]).to.eq(queryResult.amountsOut[0]);

    const expectedAmountOut = queryResult.amountsOut[0];
    const hgEthBalanceBefore: BigNumber = await hgETH.balanceOf(rsEthWhale.address);

    // Pay token in upfront and swap
    await rsETH.connect(rsEthWhale).transfer(vault.address, rplAmountIn);
    const deadline = (await currentTimestamp()).add(bn(DAY));

    await aggregatorBatchRouter.connect(rsEthWhale).swapExactIn(pathsExactIn, deadline, '0x');

    const hgEthBalanceAfter: BigNumber = await hgETH.balanceOf(rsEthWhale.address);

    expect(hgEthBalanceAfter).to.be.eq(hgEthBalanceBefore.add(expectedAmountOut));
  });
});
