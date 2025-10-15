import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { fp, maxUint } from '@helpers/numbers';
import { ONES_BYTES32, ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';
import * as expectEvent from '@helpers/expectEvent';
import { AddViaSwapRouterDeployment } from '../input';
import { setBalance } from '@nomicfoundation/hardhat-network-helpers';

describeForkTest('V3-UnbalancedAddViaSwapRouter', 'mainnet', 23534632, function () {
  const LARGE_TOKEN_HOLDER = '0xBA12222222228d8Ba445958a75a0704d566BF2C8';

  const initialBalanceWETH = fp(100);
  const initialBalanceBAL = fp(100);

  const versionNumber = 1;

  const TASK_NAME = '20251010-v3-unbalanced-add-via-swap-router';
  const CONTRACT_NAME = 'UnbalancedAddViaSwapRouter';

  let task: Task;
  let unbalancedAddRouter: Contract, permit2: Contract;
  let router: Contract;
  let factory: Contract, pool: Contract;
  let wethSigner: SignerWithAddress, alice: SignerWithAddress;
  let input: AddViaSwapRouterDeployment;
  let BAL: string;
  let balToken: Contract;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenConfig: any[];

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    input = task.input() as AddViaSwapRouterDeployment;

    unbalancedAddRouter = await task.deployedInstance(CONTRACT_NAME);
    permit2 = await task.instanceAt('IPermit2', input.Permit2);

    const tokensTask = new Task('00000000-tokens', TaskMode.READ_ONLY);
    BAL = tokensTask.output({ network: getForkedNetwork(hre) }).BAL;

    const routerTask = new Task('20250307-v3-router-v2', TaskMode.READ_ONLY, getForkedNetwork(hre));
    router = await routerTask.deployedInstance('Router');

    const testBALTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));
    balToken = await testBALTokenTask.instanceAt('TestBalancerToken', BAL);

    wethSigner = await impersonate(input.WETH, fp(10e8));
    alice = await getSigner();
  });

  before('setup contracts and parameters', async () => {
    tokenConfig = [
      {
        token: input.WETH,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
      {
        token: BAL,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
    ].sort(function (a, b) {
      return a.token.toLowerCase().localeCompare(b.token.toLowerCase());
    });
  });

  before('deploys pool', async () => {
    const task = new Task('20250324-v3-stable-pool-v2', TaskMode.READ_ONLY, getForkedNetwork(hre));
    factory = await task.deployedInstance('StablePoolFactory');

    const newStablePoolParams = {
      name: 'Mock Stable Pool',
      symbol: 'TEST',
      tokens: tokenConfig,
      amplificationParameter: 200, // Typical value for stable pools
      roleAccounts: {
        pauseManager: ZERO_ADDRESS,
        swapFeeManager: ZERO_ADDRESS,
        poolCreator: ZERO_ADDRESS,
      },
      swapFeePercentage: fp(0.01),
      hooksAddress: ZERO_ADDRESS,
      enableDonations: false,
      disableUnbalancedLiquidity: false,
      salt: ONES_BYTES32,
    };

    const poolCreationReceipt = await (
      await factory.create(
        newStablePoolParams.name,
        newStablePoolParams.symbol,
        newStablePoolParams.tokens,
        newStablePoolParams.amplificationParameter,
        newStablePoolParams.roleAccounts,
        newStablePoolParams.swapFeePercentage,
        newStablePoolParams.hooksAddress,
        newStablePoolParams.enableDonations,
        newStablePoolParams.disableUnbalancedLiquidity,
        newStablePoolParams.salt
      )
    ).wait();

    const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
    pool = await task.instanceAt('StablePool', event.args.pool);
  });

  before('initialize pool with native ETH', async () => {
    const bob = await getSigner();
    await setBalance(bob.address, fp(10e8));

    const largeHolderSigner = await impersonate(LARGE_TOKEN_HOLDER, fp(10e8));

    await balToken.connect(largeHolderSigner).transfer(bob.address, initialBalanceBAL);

    await balToken.connect(bob).approve(permit2.address, initialBalanceBAL);
    await permit2.connect(bob).approve(BAL, router.address, initialBalanceBAL, maxUint(48));

    await router
      .connect(bob)
      .initialize(pool.address, [BAL, input.WETH], [initialBalanceBAL, initialBalanceWETH], 0, true, ZERO_BYTES32, {
        value: initialBalanceWETH, // Also change this to use the constant instead of hardcoded value
      });
  });

  it('checks router version', async () => {
    const routerVersion = JSON.parse(await unbalancedAddRouter.version());
    expect(routerVersion.name).to.be.eq(CONTRACT_NAME);
    expect(routerVersion.version).to.be.eq(versionNumber);
    expect(routerVersion.deployment).to.be.eq(TASK_NAME);
  });

  it('checks router configuration', async () => {
    expect(await unbalancedAddRouter.getWeth()).to.eq(input.WETH);
    expect(await unbalancedAddRouter.getPermit2()).to.eq(permit2.address);
  });

  it('adds liquidity unbalanced', async () => {
    const exactAmount = fp(1);
    const maxAdjustableAmount = fp(10);

    // Calculate expected BPT to set appropriate minBptAmountOut.
    // Setting it slightly above proportional (105%) ensures the operation uses the EXACT_OUT swap branch.
    const totalSupply = await pool.totalSupply();
    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    const vaultContract = await vaultTask.deployedInstance('Vault');
    const vaultExtension = await vaultTask.deployedInstance('VaultExtension');
    const vaultAsExtension = vaultExtension.attach(vaultContract.address);
    const poolTokenInfo = await vaultAsExtension.getPoolTokenInfo(pool.address);

    const proportionalBpt = totalSupply.mul(exactAmount).div(poolTokenInfo.balancesRaw[1]);

    const largeHolderSigner = await impersonate(LARGE_TOKEN_HOLDER, fp(10e8));
    await balToken.connect(largeHolderSigner).transfer(alice.address, maxAdjustableAmount.mul(2));

    const wethContract = await ethers.getContractAt('IWETH', input.WETH);
    await setBalance(alice.address, fp(100));
    await wethContract.connect(alice).deposit({ value: exactAmount.mul(2) });

    await balToken.connect(alice).approve(permit2.address, maxAdjustableAmount.mul(2));
    await permit2.connect(alice).approve(BAL, unbalancedAddRouter.address, maxAdjustableAmount.mul(2), maxUint(48));

    await wethContract.connect(alice).approve(permit2.address, exactAmount.mul(2));
    await permit2.connect(alice).approve(input.WETH, unbalancedAddRouter.address, exactAmount.mul(2), maxUint(48));

    const params = {
      exactBptAmountOut: proportionalBpt,
      exactToken: input.WETH,
      exactAmount: exactAmount,
      maxAdjustableAmount: maxAdjustableAmount,
      addLiquidityUserData: '0x',
      swapUserData: '0x',
    };

    const bptBalanceBefore = await pool.balanceOf(alice.address);
    const deadline = (await ethers.provider.getBlock('latest')).timestamp + 3600;

    await unbalancedAddRouter.connect(alice).addLiquidityUnbalanced(pool.address, deadline, false, params);

    const bptBalanceAfter = await pool.balanceOf(alice.address);
    const bptReceived = bptBalanceAfter.sub(bptBalanceBefore);

    expect(bptReceived).to.be.gt(0);
    expect(bptReceived).to.be.eq(proportionalBpt);
  });

  // NB: This test must go at the end, or the Router having extra ETH messes up the add liquidity test.
  it('checks router WETH', async () => {
    const wethTx = wethSigner.sendTransaction({
      to: unbalancedAddRouter.address,
      value: ethers.utils.parseEther('1.0'),
    });
    await expect(wethTx).to.not.be.reverted;

    const aliceTx = alice.sendTransaction({
      to: unbalancedAddRouter.address,
      value: ethers.utils.parseEther('1.0'),
    });
    await expect(aliceTx).to.be.reverted;
  });
});
