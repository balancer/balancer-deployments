import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { fp, maxUint } from '@helpers/numbers';
import { MAX_UINT112, ONES_BYTES32, ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';
import * as expectEvent from '@helpers/expectEvent';
import { UnbalancedLiquidityRouterViaSwapDeployment } from '../input';
import { setBalance } from '@nomicfoundation/hardhat-network-helpers';
import { currentTimestamp, MINUTE } from '@helpers/time';

describeForkTest('V3-UnbalancedAddRouter', 'mainnet', 23227500, function () {
  const versionNumber = 1;

  const TASK_NAME = '20250826-v3-unbalanced-add-router';
  const CONTRACT_NAME = 'AddUnbalancedLiquidityViaSwapRouter';
  const POOL_CONTRACT_NAME = 'ReClammPool';

  let task: Task;
  let router: Contract, permit2: Contract;
  let factory: Contract, pool: Contract;
  let wethSigner: SignerWithAddress, alice: SignerWithAddress;
  let input: UnbalancedLiquidityRouterViaSwapDeployment;
  let BAL: string;
  let balToken: Contract;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenConfig: any[];

  const AAVE = '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9';
  const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
  const AAVE_WETH_POOL = '0x9d1fcf346ea1b073de4d5834e25572cc6ad71f4d';

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    input = task.input() as UnbalancedLiquidityRouterViaSwapDeployment;

    router = await task.deployedInstance(CONTRACT_NAME);
    permit2 = await task.instanceAt('IPermit2', input.Permit2);

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

  it('adds liquidity unbalanced to a reclamm pool', async () => {
    const totalSupply = await pool.totalSupply();
    const { balancesRaw } = await pool.getTokenInfo();
    const bptAmountOut = totalSupply.div(10);

    console.log('total supply: ', totalSupply);
    console.log('balances raw: ', balancesRaw);

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

    console.log('about to add');
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
