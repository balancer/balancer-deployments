import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { fp, maxUint } from '@helpers/numbers';
import { ONES_BYTES32, ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';
import * as expectEvent from '@helpers/expectEvent';
import { RouterDeployment } from '../input';
import { setBalance } from '@nomicfoundation/hardhat-network-helpers';

describeForkTest.skip('Router-V3', 'mainnet', 21336200, function () {
  let task: Task;
  let router: Contract, permit2: Contract;
  let factory: Contract, pool: Contract;
  let wethSigner: SignerWithAddress, alice: SignerWithAddress;
  let input: RouterDeployment;
  let WETH: Contract, BAL: Contract;

  const LARGE_TOKEN_HOLDER = '0xBA12222222228d8Ba445958a75a0704d566BF2C8';

  const initialBalanceWETH = fp(1e2);
  const initialBalanceBAL = fp(1e5);

  const versionNumber = 1;
  const deploymentId = '20241205-v3-router';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenConfig: any[];

  before('run task', async () => {
    task = new Task(deploymentId, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    input = task.input() as RouterDeployment;

    router = await task.deployedInstance('Router');
    permit2 = await task.instanceAt('IPermit2', input.Permit2);

    const testBALTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));
    WETH = await testBALTokenTask.instanceAt('TestBalancerToken', input.WETH);
    BAL = await testBALTokenTask.instanceAt('TestBalancerToken', input.BAL);

    wethSigner = await impersonate(WETH.address, fp(10e8));
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
        token: input.BAL,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
    ].sort(function (a, b) {
      return a.token.toLowerCase().localeCompare(b.token.toLowerCase());
    });
  });

  before('deploys pool', async () => {
    const task = new Task('20241205-v3-weighted-pool', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    factory = await task.deployedInstance('WeightedPoolFactory');

    const newWeightedPoolParams = {
      name: 'Mock Weighted Pool',
      symbol: 'TEST',
      tokens: tokenConfig,
      normalizedWeights: [fp(0.8), fp(0.2)],
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
        newWeightedPoolParams.name,
        newWeightedPoolParams.symbol,
        newWeightedPoolParams.tokens,
        newWeightedPoolParams.normalizedWeights,
        newWeightedPoolParams.roleAccounts,
        newWeightedPoolParams.swapFeePercentage,
        newWeightedPoolParams.hooksAddress,
        newWeightedPoolParams.enableDonations,
        newWeightedPoolParams.disableUnbalancedLiquidity,
        newWeightedPoolParams.salt
      )
    ).wait();

    const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
    pool = await task.instanceAt('WeightedPool', event.args.pool);
  });

  it('checks router version', async () => {
    const routerVersion = JSON.parse(await router.version());
    expect(routerVersion.name).to.be.eq('Router');
    expect(routerVersion.version).to.be.eq(versionNumber);
    expect(routerVersion.deployment).to.be.eq(deploymentId);
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

  it('initialize pool with native ETH', async () => {
    const bob = await getSigner();
    await setBalance(bob.address, fp(10e8));

    const largeHolderSigner = await impersonate(LARGE_TOKEN_HOLDER, fp(10e8));

    BAL.connect(largeHolderSigner).transfer(bob.address, initialBalanceBAL);

    await BAL.connect(bob).approve(permit2.address, initialBalanceBAL);
    await permit2.connect(bob).approve(input.BAL, router.address, initialBalanceBAL, maxUint(48));

    await router
      .connect(bob)
      .initialize(
        pool.address,
        [input.BAL, input.WETH],
        [initialBalanceBAL, initialBalanceWETH],
        0,
        true,
        ZERO_BYTES32,
        {
          value: ethers.utils.parseEther('1000.0'),
        }
      );
  });
});
