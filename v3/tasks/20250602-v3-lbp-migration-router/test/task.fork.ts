import hre from 'hardhat';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import * as expectEvent from '@helpers/expectEvent';
import { fp, maxUint } from '@helpers/numbers';
import { ONES_BYTES32, ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';
import { setNextBlockTimestamp, currentTimestamp, DAY, HOUR } from '@helpers/time';

describeForkTest('LBPMigrationRouter', 'mainnet', 22624604, function () {
  const HIGH_WEIGHT = fp(0.8);
  const LOW_WEIGHT = fp(0.2);

  const SWAP_FEE = fp(0.01);

  const TOKEN_HOLDER = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  const INITIAL_BAL = fp(26667);
  const INITIAL_WETH = fp(8);

  let lbpFactory: Contract;
  let pool: Contract;
  let trustedRouter: Contract;
  let lbpMigrationRouter: Contract;
  let vault: Contract;
  let balToken: Contract;
  let wethToken: Contract;
  let permit2: Contract;
  let task: Task;
  let admin: SignerWithAddress;
  let whale: SignerWithAddress;
  let excessReceiver: SignerWithAddress;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenConfig: any[];
  let WETH: string;
  let BAL: string;

  before('run task', async () => {
    const fork = getForkedNetwork(hre);

    task = new Task('20250602-v3-lbp-migration-router', TaskMode.TEST, fork);
    await task.run({ force: true });
    lbpMigrationRouter = await task.deployedInstance('LBPMigrationRouter');

    const lbpFactoryTask = new Task('20250307-v3-liquidity-bootstrapping-pool', TaskMode.READ_ONLY, fork);
    lbpFactory = await lbpFactoryTask.deployedInstance('LBPoolFactory');

    const routerTask = new Task('20250307-v3-router-v2', TaskMode.READ_ONLY, fork);
    trustedRouter = await routerTask.deployedInstance('Router');

    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, fork);
    vault = await vaultTask.deployedInstance('Vault');
    vault = await vaultTask.instanceAt('VaultExtension', vault.address);

    const permit2Task = new Task('00000000-permit2', TaskMode.READ_ONLY);
    const permit2Address = permit2Task.output({ network: 'mainnet' }).Permit2;
    permit2 = await task.instanceAt('IPermit2', permit2Address);

    admin = await getSigner(0);
    whale = await impersonate(TOKEN_HOLDER, fp(10e8));
    excessReceiver = await getSigner(1);

    const tokensTask = new Task('00000000-tokens', TaskMode.READ_ONLY);

    WETH = tokensTask.output({ network: fork }).WETH;
    BAL = tokensTask.output({ network: fork }).BAL;

    balToken = await task.instanceAt('IERC20', BAL);
    wethToken = await task.instanceAt('IERC20', WETH);

    tokenConfig = [
      {
        token: WETH,
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

  it('migrate LBP', async () => {
    const startTime = await currentTimestamp();
    const endTime = startTime.add(DAY);

    // Create a new LBP
    const newLBPParams = {
      owner: admin.address,
      projectToken: BAL,
      reserveToken: WETH,
      projectTokenStartWeight: HIGH_WEIGHT,
      reserveTokenStartWeight: LOW_WEIGHT,
      projectTokenEndWeight: LOW_WEIGHT,
      reserveTokenEndWeight: HIGH_WEIGHT,
      startTime: startTime.add(HOUR),
      endTime: endTime,
      blockProjectTokenSwapsIn: false,
    };
    const poolCreationReceipt = await (
      await lbpFactory.create('LBP', 'LBP-TEST', newLBPParams, SWAP_FEE, ONES_BYTES32)
    ).wait();

    const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
    pool = await task.instanceAt('LBPool', event.args.pool);

    // Approve the trusted router to manage the pool
    balToken.connect(whale).transfer(admin.address, INITIAL_BAL);
    wethToken.connect(whale).transfer(admin.address, INITIAL_WETH);
    await balToken.connect(admin).approve(permit2.address, INITIAL_BAL);
    await permit2.connect(admin).approve(BAL, trustedRouter.address, INITIAL_BAL, maxUint(48));
    await wethToken.connect(admin).approve(permit2.address, INITIAL_WETH);
    await permit2.connect(admin).approve(WETH, trustedRouter.address, INITIAL_WETH, maxUint(48));
    // Initialize the LBP
    await trustedRouter.connect(admin).initialize(
      pool.address,
      [BAL, WETH],
      [INITIAL_BAL, INITIAL_WETH],
      0,
      false, // wethIsETH
      ZERO_BYTES32
    );

    setNextBlockTimestamp(endTime.add(1));

    await (await pool.connect(admin).approve(lbpMigrationRouter.address, maxUint(256))).wait();

    const migrateReceipt = await (
      await lbpMigrationRouter
        .connect(admin)
        .migrateLiquidity(pool.address, [INITIAL_BAL.div(2), INITIAL_WETH.div(2)], 0, [0, 0], excessReceiver.address, {
          name: 'Weighted Pool',
          symbol: 'WP-TEST',
          normalizedWeights: [fp(0.5), fp(0.5)],
          roleAccounts: {
            pauseManager: ZERO_ADDRESS,
            swapFeeManager: ZERO_ADDRESS,
            poolCreator: ZERO_ADDRESS,
          },
          swapFeePercentage: SWAP_FEE,
          poolHooksContract: ZERO_ADDRESS,
          enableDonations: false,
          disableUnbalancedLiquidity: false,
          salt: ONES_BYTES32,
        })
    ).wait();

    const migrationEvent = expectEvent.inReceipt(migrateReceipt, 'PoolMigrated');
    const weightedPool = await task.instanceAt('WeightedPool', migrationEvent.args.weightedPool);

    expect(await weightedPool.getTokens()).to.deep.equal([BAL, WETH]);
    expect(await weightedPool.getNormalizedWeights()).to.deep.equal([fp(0.5), fp(0.5)]);

    const currentBalances = await vault.getCurrentLiveBalances(weightedPool.address);
    expect(currentBalances[0]).to.equal(INITIAL_BAL.div(2));
    expect(currentBalances[1]).to.equal(INITIAL_WETH.div(2));
  });
});
