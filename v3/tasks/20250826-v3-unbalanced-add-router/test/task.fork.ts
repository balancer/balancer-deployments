import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { fp } from '@helpers/numbers';
import { ZERO_ADDRESS } from '@helpers/constants';
import { UnbalancedLiquidityRouterViaSwapDeployment } from '../input';
import { currentTimestamp, MINUTE } from '@helpers/time';

describeForkTest('V3-UnbalancedAddRouter', 'mainnet', 23227500, function () {
  const versionNumber = 1;

  const TASK_NAME = '20250826-v3-unbalanced-add-router';
  const CONTRACT_NAME = 'AddUnbalancedLiquidityViaSwapRouter';
  const POOL_CONTRACT_NAME = 'ReClammPool';

  let task: Task;
  let router: Contract, permit2: Contract;
  let pool: Contract;
  let wethSigner: SignerWithAddress, alice: SignerWithAddress;
  let input: UnbalancedLiquidityRouterViaSwapDeployment;

  const AAVE = '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9';
  let WETH: string;
  const AAVE_WETH_POOL = '0x9d1fcf346ea1b073de4d5834e25572cc6ad71f4d';

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    input = task.input() as UnbalancedLiquidityRouterViaSwapDeployment;

    router = await task.deployedInstance(CONTRACT_NAME);
    permit2 = await task.instanceAt('IPermit2', input.Permit2);

    WETH = input.WETH;
    wethSigner = await impersonate(input.WETH, fp(10e8));
    alice = await getSigner();
  });

  before('setup contracts and parameters', async () => {
    const task = new Task('20250702-v3-reclamm-pool-v2', TaskMode.READ_ONLY, getForkedNetwork(hre));
    pool = await task.instanceAt(POOL_CONTRACT_NAME, AAVE_WETH_POOL);
  });

  it('checks router version', async () => {
    const routerVersion = JSON.parse(await router.version());
    expect(routerVersion.name).to.be.eq(CONTRACT_NAME);
    expect(routerVersion.version).to.be.eq(versionNumber);
    expect(routerVersion.deployment).to.be.eq(TASK_NAME);
  });

  it('checks getters', async () => {
    expect(await router.getPermit2()).to.eq(permit2.address);
    expect(await router.getWeth()).to.eq(input.WETH);
  });

  it('checks router WETH', async () => {
    const wethTx = wethSigner.sendTransaction({
      to: router.address,
      value: ethers.utils.parseEther('1.0'),
    });
    await expect(wethTx).to.not.be.reverted;

    const aliceTx = alice.sendTransaction({
      to: router.address,
      value: ethers.utils.parseEther('1.0'),
    });
    await expect(aliceTx).to.be.reverted;
  });

  it('adds liquidity unbalanced to a reclamm pool', async () => {
    const totalSupply = await pool.totalSupply();
    const bptAmountOut = totalSupply.div(10);

    const amountsIn = await router
      .connect(ZERO_ADDRESS)
      .callStatic.queryAddLiquidityProportional(pool.address, bptAmountOut, alice.address, '0x');
    const aaveAmountInAddProportional = amountsIn[0];
    const wethAmountInAddProportional = amountsIn[1];

    const wethSwapForAave = await router
      .connect(ZERO_ADDRESS)
      .callStatic.querySwapSingleTokenExactOut(
        pool.address,
        WETH,
        AAVE,
        aaveAmountInAddProportional,
        alice.address,
        '0x'
      );

    const addLiquidityParams = {
      maxAmountsIn: amountsIn,
      exactBptAmountOut: bptAmountOut,
      userData: '0x',
    };

    const swapExactOutParams = {
      tokenIn: WETH,
      tokenOut: AAVE,
      exactAmountOut: aaveAmountInAddProportional,
      maxAmountIn: wethSwapForAave.mul(101).div(100), // 1% slippage
      userData: '0x',
    };

    await router
      .connect(alice)
      .addUnbalancedLiquidityViaSwapExactOut(
        pool.address,
        (await currentTimestamp()).add(MINUTE),
        true,
        addLiquidityParams,
        swapExactOutParams,
        { value: wethAmountInAddProportional.add(wethSwapForAave) }
      );
  });
});
