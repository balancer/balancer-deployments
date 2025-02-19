import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { BigNumber, Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { bn, fp, maxUint } from '@helpers/numbers';
import { MAX_UINT256, ZERO_ADDRESS } from '@helpers/constants';
import { AggregatorRouterDeployment } from '../input';
import { currentTimestamp, DAY } from '@helpers/time';
import * as expectEvent from '@helpers/expectEvent';

describeForkTest('AggregatorRouter-V3', 'mainnet', 21880900, function () {
  let task: Task;
  let aggregatorRouter: Contract;
  let pool: Contract;
  let rplWhale: SignerWithAddress, zero: SignerWithAddress;
  let XRPL: Contract, RPL: Contract;

  // Using a vanilla pool for simplicity.
  const XRPL_RPL_POOL = '0x90cdc7476f74f124466caa70a084887f2a41677e';
  const XRPL_ADDRESS = '0x1db1afd9552eeb28e2e36597082440598b7f1320';
  const RPL_ADDRESS = '0xd33526068d116ce69f19a9ee46f0bd304f21a51f';
  const RPL_WHALE = '0x57757e3d981446d585af0d9ae4d7df6d64647806';

  const versionNumber = 1;
  const deploymentId = '20250218-v3-aggregator-router';

  before('run task', async () => {
    task = new Task(deploymentId, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    aggregatorRouter = await task.deployedInstance('AggregatorRouter');

    const testTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));

    XRPL = await testTokenTask.instanceAt('TestBalancerToken', XRPL_ADDRESS);
    RPL = await testTokenTask.instanceAt('TestBalancerToken', RPL_ADDRESS);

    rplWhale = await impersonate(RPL_WHALE, fp(10));
    zero = await impersonate(ZERO_ADDRESS, fp(10));
  });

  before('gets pool contract', async () => {
    const stablePoolTask = new Task('20241205-v3-stable-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    pool = await stablePoolTask.instanceAt('StablePool', XRPL_RPL_POOL);
  });

  it('checks router version', async () => {
    const routerVersion = JSON.parse(await aggregatorRouter.version());
    expect(routerVersion.name).to.be.eq('AggregatorRouter');
    expect(routerVersion.version).to.be.eq(versionNumber);
    expect(routerVersion.deployment).to.be.eq(deploymentId);
  });

  describe('swap', async () => {
    const rplAmountIn = fp(100);
    let expectedAmountOut: BigNumber;

    sharedBeforeEach('query', async () => {
      expectedAmountOut = await aggregatorRouter
        .connect(zero)
        .callStatic.querySwapSingleTokenExactIn(
          pool.address,
          RPL_ADDRESS,
          XRPL_ADDRESS,
          rplAmountIn,
          rplWhale.address,
          '0x'
        );
      console.log('expected amount out: ', expectedAmountOut);

      await RPL.connect(rplWhale).transfer(await aggregatorRouter.getVault(), rplAmountIn);

      const actualAmountOut = await aggregatorRouter
        .connect(rplWhale)
        .callStatic.swapSingleTokenExactIn(
          pool.address,
          RPL_ADDRESS,
          XRPL_ADDRESS,
          rplAmountIn,
          0,
          (await currentTimestamp()).add(bn(DAY)),
          '0x'
        );

      console.log('actual amount out: ', actualAmountOut);
    });

    it('performs swap', async () => {
      const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
      const vault = await vaultTask.deployedInstance('Vault');

      const xRplBalanceBefore: BigNumber = await XRPL.balanceOf(rplWhale.address);

      console.log('about to query');

      console.log('about to transfer');

      await RPL.connect(rplWhale).transfer(await aggregatorRouter.getVault(), rplAmountIn);

      console.log('about to swap; amount out: ', expectedAmountOut);

      const tx = await aggregatorRouter
        .connect(rplWhale)
        .swapSingleTokenExactIn(
          pool.address,
          RPL_ADDRESS,
          XRPL_ADDRESS,
          rplAmountIn,
          0,
          (await currentTimestamp()).add(bn(DAY)),
          '0x'
        );
      const receipt = await tx.wait();
      const event = expectEvent.inIndirectReceipt(receipt, vault.interface, 'Swap');
      console.log('swap event: ', event);
      console.log('Swapped');

      const xRplBalanceAfter: BigNumber = await XRPL.balanceOf(rplWhale.address);
      console.log('balance before: ', xRplBalanceBefore);
      console.log('amount out: ', expectedAmountOut);
      console.log('balance after: ', xRplBalanceAfter);

      expect(xRplBalanceAfter).to.be.eq(xRplBalanceBefore.add(expectedAmountOut));
    });
  });
});
