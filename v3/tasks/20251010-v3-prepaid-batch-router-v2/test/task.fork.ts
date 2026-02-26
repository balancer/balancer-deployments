import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { BigNumber, Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { bn, fp } from '@helpers/numbers';
import { ZERO_ADDRESS } from '@helpers/constants';
import { currentTimestamp, DAY } from '@helpers/time';

describeForkTest('V3-PrepaidBatchRouter-V2', 'mainnet', 23534632, function () {
  let task: Task;
  let prepaidBatchRouter: Contract;
  let pool: Contract;
  let vault: Contract;
  let rsEthWhale: SignerWithAddress, zero: SignerWithAddress;
  let wethSigner: SignerWithAddress, alice: SignerWithAddress;
  let rsETH: Contract, hgETH: Contract;

  // Using a vanilla pool for simplicity.
  const RSETH_HGETH_POOL = '0x6649a010cbcf5742e7a13a657df358556b3e55cf';
  const RSETH_ADDRESS = '0xa1290d69c65a6fe4df752f95823fae25cb99e5a7';
  const HGETH_ADDRESS = '0xc824A08dB624942c5E5F330d56530cD1598859fD';
  const RSETH_WHALE = '0x85d456B2DfF1fd8245387C0BfB64Dfb700e98Ef3';

  const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

  const versionNumber = 2;
  const deploymentId = '20251010-v3-prepaid-batch-router-v2';

  before('run task', async () => {
    task = new Task(deploymentId, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    prepaidBatchRouter = await task.deployedInstance('BatchRouter');

    const testTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));
    const WETH = await testTokenTask.instanceAt('TestBalancerToken', WETH_ADDRESS);

    rsETH = await testTokenTask.instanceAt('TestBalancerToken', RSETH_ADDRESS);
    hgETH = await testTokenTask.instanceAt('TestBalancerToken', HGETH_ADDRESS);

    rsEthWhale = await impersonate(RSETH_WHALE, fp(10));
    zero = await impersonate(ZERO_ADDRESS, fp(10));

    wethSigner = await impersonate(WETH.address, fp(10e8));
    alice = await getSigner();
  });

  before('gets Vault and pool contract', async () => {
    const stablePoolTask = new Task('20241205-v3-stable-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    pool = await stablePoolTask.instanceAt('StablePool', RSETH_HGETH_POOL);

    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
  });

  it('checks router version', async () => {
    const routerVersion = JSON.parse(await prepaidBatchRouter.version());
    expect(routerVersion.name).to.be.eq('PrepaidBatchRouter');
    expect(routerVersion.version).to.be.eq(versionNumber);
    expect(routerVersion.deployment).to.be.eq(deploymentId);
  });

  it('checks router configuration', async () => {
    expect(await prepaidBatchRouter.getWeth()).to.eq(WETH_ADDRESS);
    expect(await prepaidBatchRouter.getPermit2()).to.eq(ZERO_ADDRESS);
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

    const queryResult = await prepaidBatchRouter
      .connect(zero)
      .callStatic.querySwapExactIn(pathsExactIn, rsEthWhale.address, '0x');

    expect(queryResult.tokensOut[0]).to.eq(HGETH_ADDRESS);
    expect(queryResult.pathAmountsOut[0]).to.eq(queryResult.amountsOut[0]);

    const expectedAmountOut = queryResult.amountsOut[0];
    const hgEthBalanceBefore: BigNumber = await hgETH.balanceOf(rsEthWhale.address);

    // Pay token in upfront and swap.
    await rsETH.connect(rsEthWhale).transfer(vault.address, rplAmountIn);
    const deadline = (await currentTimestamp()).add(bn(DAY));

    // Set actual expected amount out.
    pathsExactIn[0].minAmountOut = expectedAmountOut;

    await prepaidBatchRouter.connect(rsEthWhale).swapExactIn(pathsExactIn, deadline, false, '0x');

    const hgEthBalanceAfter: BigNumber = await hgETH.balanceOf(rsEthWhale.address);

    expect(hgEthBalanceAfter).to.be.eq(hgEthBalanceBefore.add(expectedAmountOut));
  });

  it('checks batch router WETH', async () => {
    const wethTx = wethSigner.sendTransaction({
      to: prepaidBatchRouter.address,
      value: ethers.utils.parseEther('1.0'),
    });
    await expect(wethTx).to.not.be.reverted;

    const aliceTx = alice.sendTransaction({
      to: prepaidBatchRouter.address,
      value: ethers.utils.parseEther('1.0'),
    });
    await expect(aliceTx).to.be.reverted;
  });

  it('reverts on multicall in prepaid mode', async () => {
    const dummyCalldata = prepaidBatchRouter.interface.encodeFunctionData('querySwapExactIn', [
      [],
      rsEthWhale.address,
      '0x',
    ]);

    try {
      await prepaidBatchRouter.connect(rsEthWhale).multicall([dummyCalldata]);
      expect.fail('Expected transaction to revert');
    } catch (error: unknown) {
      // OperationNotSupported() selector is 0x29a270f5.
      const err = error as { data?: string; message?: string };
      expect(err.data || err.message).to.include('0x29a270f5');
    }
  });
});
