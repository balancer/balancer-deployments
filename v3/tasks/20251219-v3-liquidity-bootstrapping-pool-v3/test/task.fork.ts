import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { ONES_BYTES32, ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';
import { bn, fp, maxUint } from '@helpers/numbers';
import { advanceTime, currentTimestamp, DAY, HOUR, MONTH } from '@helpers/time';

describeForkTest('LBPool-V3 (V3)', 'mainnet', 24019450, function () {
  const TASK_NAME = '20251219-v3-liquidity-bootstrapping-pool-v3';
  const POOL_CONTRACT_NAME = 'LBPool';
  const FACTORY_CONTRACT_NAME = POOL_CONTRACT_NAME + 'Factory';
  const VERSION_NUM = 3;

  const HIGH_WEIGHT = fp(0.8);
  const LOW_WEIGHT = fp(0.2);

  const SWAP_FEE = fp(0.01);

  const TEST_BAL_ADMIN = '0x9098b50ee2d9E4c3C69928A691DA3b192b4C9673';

  const INITIAL_BAL = fp(26667);
  const INITIAL_WETH = fp(8);

  let vault: Contract, vaultExtension: Contract;
  let factory: Contract, pool: Contract;
  let trustedRouter: Contract, migrationRouter: Contract;
  let bal: Contract, weth: Contract;
  let permit2: Contract;
  let task: Task;
  let admin: SignerWithAddress, projectTreasury: SignerWithAddress;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenConfig: any[];
  const projectTokenLbpEndWeight = LOW_WEIGHT;
  const reserveTokenLbpEndWeight = HIGH_WEIGHT;

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    factory = await task.deployedInstance(FACTORY_CONTRACT_NAME);
    migrationRouter = await task.deployedInstance('LBPMigrationRouter');

    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
    vaultExtension = await vaultTask.deployedInstance('VaultExtension');

    const routerTask = new Task('20250307-v3-router-v2', TaskMode.READ_ONLY, getForkedNetwork(hre));
    trustedRouter = await routerTask.deployedInstance('Router');

    const permit2Task = new Task('00000000-permit2', TaskMode.READ_ONLY);
    const permit2Address = permit2Task.output({ network: 'mainnet' }).Permit2;
    permit2 = await task.instanceAt('IPermit2', permit2Address);

    admin = await impersonate(TEST_BAL_ADMIN, fp(10e8));
    projectTreasury = await getSigner(0);

    const tokensTask = new Task('00000000-tokens', TaskMode.READ_ONLY);
    const testBALTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));

    const fork = getForkedNetwork(hre);

    const WETH = tokensTask.output({ network: fork }).WETH;

    bal = await testBALTokenTask.deployedInstance('TestBalancerToken');
    weth = await task.instanceAt('IERC20', WETH);
  });

  before('setup contracts and parameters', async () => {
    tokenConfig = [
      {
        token: weth.address,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
      {
        token: bal.address,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
    ].sort(function (a, b) {
      return a.token.toLowerCase().localeCompare(b.token.toLowerCase());
    });
  });

  it('has trusted router', async () => {
    expect(await factory.getTrustedRouter()).to.eq(trustedRouter.address);
  });

  it('deploys LBP', async () => {
    const startTime = await currentTimestamp();

    const lbpCommonParams = {
      name: 'Mock Seedless LBP',
      symbol: 'SLBP-TEST',
      owner: admin.address,
      projectToken: bal.address,
      reserveToken: weth.address,
      startTime: startTime.add(HOUR),
      endTime: startTime.add(DAY),
      blockProjectTokenSwapsIn: false,
    };

    const migrationParams = {
      migrationRouter: migrationRouter.address,
      lockDurationAfterMigration: 12 * MONTH,
      bptPercentageToMigrate: fp(0.8),
      migrationWeightProjectToken: HIGH_WEIGHT,
      migrationWeightReserveToken: LOW_WEIGHT,
    };

    const lbpParams = {
      projectTokenStartWeight: HIGH_WEIGHT,
      reserveTokenStartWeight: LOW_WEIGHT,
      projectTokenEndWeight: projectTokenLbpEndWeight,
      reserveTokenEndWeight: reserveTokenLbpEndWeight,
      reserveTokenVirtualBalance: INITIAL_WETH,
    };

    const poolCreationReceipt = await (
      await factory.createWithMigration(
        lbpCommonParams,
        migrationParams,
        lbpParams,
        SWAP_FEE,
        ONES_BYTES32,
        ZERO_ADDRESS
      )
    ).wait();

    const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
    pool = await task.instanceAt(POOL_CONTRACT_NAME, event.args.pool);
  });

  it('checks pool tokens', async () => {
    const poolTokens = (await pool.getTokens()).map((token: string) => token.toLowerCase());
    expect(poolTokens).to.be.deep.eq(tokenConfig.map((config) => config.token.toLowerCase()));

    expect(await pool.getProjectToken()).to.eq(bal.address);
    expect(await pool.getReserveToken()).to.eq(weth.address);
  });

  it('checks pool version', async () => {
    const version = JSON.parse(await pool.version());
    expect(version.deployment).to.be.eq(TASK_NAME);
    expect(version.version).to.be.eq(VERSION_NUM);
    expect(version.name).to.be.eq(POOL_CONTRACT_NAME);
  });

  it('checks factory version', async () => {
    const version = JSON.parse(await factory.version());
    expect(version.deployment).to.be.eq(TASK_NAME);
    expect(version.version).to.be.eq(VERSION_NUM);
    expect(version.name).to.be.eq(FACTORY_CONTRACT_NAME);
  });

  it('sale has not started yet', async () => {
    expect(await pool.isSwapEnabled()).to.be.false;
  });

  it('initializes the pool', async () => {
    // Give the admin tokens: mint test tokens, get WETH
    await bal.connect(admin).mint(admin.address, INITIAL_BAL);

    await bal.connect(admin).approve(permit2.address, INITIAL_BAL);
    await permit2.connect(admin).approve(bal.address, trustedRouter.address, INITIAL_BAL, maxUint(48));

    await trustedRouter.connect(admin).initialize(
      pool.address,
      [bal.address, weth.address],
      [INITIAL_BAL, 0], // 0 reserve tokens
      0,
      false, // wethIsETH
      ZERO_BYTES32
    );
  });

  it('starts the sale', async () => {
    await advanceTime(2 * HOUR);

    expect(await pool.isSwapEnabled()).to.be.true;

    // Actually need to buy some to get a non-zero reserve balance for migration.
    await trustedRouter
      .connect(admin)
      .swapSingleTokenExactIn(
        pool.address,
        weth.address,
        bal.address,
        INITIAL_WETH.div(4),
        0,
        (await currentTimestamp()).add(bn(DAY)),
        true,
        '0x',
        { value: INITIAL_WETH.div(4) }
      );
  });

  it('ends the sale', async () => {
    await advanceTime(DAY);

    expect(await pool.isSwapEnabled()).to.be.false;
  });

  it('migrates the liquidity', async () => {
    await pool.connect(admin).approve(migrationRouter.address, maxUint(256));
    const weightedPoolProjectWeight = HIGH_WEIGHT;
    const weightedPoolReserveWeight = LOW_WEIGHT;

    const vaultAsExtension = vaultExtension.attach(vault.address);
    const balancesBeforeMigration = await vaultAsExtension.getCurrentLiveBalances(pool.address);
    const actualBalInPool = balancesBeforeMigration[0];
    const actualWethInPool = balancesBeforeMigration[1];

    // For seedless LBP, effective reserve = real + virtual
    const [, virtualBalanceScaled18] = await pool.getReserveTokenVirtualBalance();
    const effectiveWethInPool = actualWethInPool.add(virtualBalanceScaled18);

    const migrateReceipt = await (
      await migrationRouter.connect(admin).migrateLiquidity(pool.address, projectTreasury.address, {
        name: 'Weighted Pool',
        symbol: 'WP-TEST',
        normalizedWeights: [weightedPoolProjectWeight, weightedPoolReserveWeight],
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

    expect(await weightedPool.getTokens()).to.deep.equal([bal.address, weth.address]);
    expect(await weightedPool.getNormalizedWeights()).to.deep.equal([HIGH_WEIGHT, LOW_WEIGHT]);

    const currentBalances = await vaultAsExtension.getCurrentLiveBalances(weightedPool.address);

    // Get LBP end weights for spot price calculation
    const lbpWeights = await pool.getNormalizedWeights();

    // Spot price = (BAL / BAL_weight) / (effectiveWETH / WETH_weight)
    // In terms of BAL per WETH
    const spotPrice = actualBalInPool
      .mul(lbpWeights[1]) // reserve weight
      .div(effectiveWethInPool)
      .mul(fp(1))
      .div(lbpWeights[0]); // project weight

    // Expected BAL migrated = 80% of actual BAL
    const expectedBalMigrated = actualBalInPool.mul(80).div(100);

    // Expected WETH = BAL_migrated / spotPrice * (reserveWeight / projectWeight)
    const expectedWethMigrated = expectedBalMigrated
      .mul(fp(1))
      .div(spotPrice)
      .mul(weightedPoolReserveWeight)
      .div(weightedPoolProjectWeight);

    expect(currentBalances[0]).to.equalWithError(expectedBalMigrated);
    expect(currentBalances[1]).to.equalWithError(expectedWethMigrated);
  });
});
