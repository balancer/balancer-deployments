import hre from 'hardhat';
import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { ONES_BYTES32, ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';
import { fp, maxUint } from '@helpers/numbers';
import { advanceTime, currentTimestamp, DAY, HOUR, MONTH } from '@helpers/time';

describeForkTest('LBPool-V3 (V2)', 'mainnet', 22839800, function () {
  const TASK_NAME = '20250701-v3-liquidity-bootstrapping-pool-v2';
  const POOL_CONTRACT_NAME = 'LBPool';
  const FACTORY_CONTRACT_NAME = POOL_CONTRACT_NAME + 'Factory';
  const VERSION_NUM = 2;

  const HIGH_WEIGHT = fp(0.8);
  const LOW_WEIGHT = fp(0.2);

  const SWAP_FEE = fp(0.01);

  const TOKEN_HOLDER = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  const INITIAL_BAL = fp(26667);
  const INITIAL_WETH = fp(8);

  let vault: Contract, vaultExtension: Contract;
  let factory: Contract, pool: Contract;
  let trustedRouter: Contract;
  let balToken: Contract;
  let wethToken: Contract;
  let permit2: Contract;
  let task: Task;
  let migrationRouter: Contract;
  let admin: SignerWithAddress, whale: SignerWithAddress, projectTreasury: SignerWithAddress;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenConfig: any[];
  let WETH: string;
  const BAL = '0xba100000625a3754423978a60c9317c58a424e3D';
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

    admin = await getSigner(0);
    projectTreasury = await getSigner(1);
    whale = await impersonate(TOKEN_HOLDER, fp(10e8));

    const tokensTask = new Task('00000000-tokens', TaskMode.READ_ONLY);

    const fork = getForkedNetwork(hre);

    WETH = tokensTask.output({ network: fork }).WETH;

    balToken = await task.instanceAt('IERC20', BAL);
    wethToken = await task.instanceAt('IERC20', WETH);
  });

  before('setup contracts and parameters', async () => {
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

  it('has trusted router', async () => {
    expect(await factory.getTrustedRouter()).to.eq(trustedRouter.address);
  });

  it('deploys LBP', async () => {
    const startTime = await currentTimestamp();

    const lbpParams = {
      owner: admin.address,
      projectToken: BAL,
      reserveToken: WETH,
      projectTokenStartWeight: HIGH_WEIGHT,
      reserveTokenStartWeight: LOW_WEIGHT,
      projectTokenEndWeight: projectTokenLbpEndWeight,
      reserveTokenEndWeight: reserveTokenLbpEndWeight,
      startTime: startTime.add(HOUR),
      endTime: startTime.add(DAY),
      blockProjectTokenSwapsIn: false,
    };

    const poolCreationReceipt = await (
      await factory.createWithMigration(
        'Mock LBP',
        'LBP-TEST',
        lbpParams,
        SWAP_FEE,
        ONES_BYTES32,
        ZERO_ADDRESS,
        12 * MONTH,
        fp(0.8), // Migrate 80% of the liquidity
        HIGH_WEIGHT,
        LOW_WEIGHT
      )
    ).wait();

    const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
    pool = await task.instanceAt(POOL_CONTRACT_NAME, event.args.pool);
  });

  it('checks pool tokens', async () => {
    const poolTokens = (await pool.getTokens()).map((token: string) => token.toLowerCase());
    expect(poolTokens).to.be.deep.eq(tokenConfig.map((config) => config.token.toLowerCase()));

    expect(await pool.getProjectToken()).to.eq(BAL);
    expect(await pool.getReserveToken()).to.eq(WETH);
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
    // Give the admin tokens
    balToken.connect(whale).transfer(admin.address, INITIAL_BAL);
    wethToken.connect(whale).transfer(admin.address, INITIAL_WETH);

    await balToken.connect(admin).approve(permit2.address, INITIAL_BAL);
    await permit2.connect(admin).approve(BAL, trustedRouter.address, INITIAL_BAL, maxUint(48));

    await wethToken.connect(admin).approve(permit2.address, INITIAL_WETH);
    await permit2.connect(admin).approve(WETH, trustedRouter.address, INITIAL_WETH, maxUint(48));

    await trustedRouter.connect(admin).initialize(
      pool.address,
      [BAL, WETH],
      [INITIAL_BAL, INITIAL_WETH],
      0,
      false, // wethIsETH
      ZERO_BYTES32
    );
  });

  it('starts the sale', async () => {
    await advanceTime(2 * HOUR);

    expect(await pool.isSwapEnabled()).to.be.true;
  });

  it('ends the sale', async () => {
    await advanceTime(DAY);

    expect(await pool.isSwapEnabled()).to.be.false;
  });

  it('migrates the liquidity', async () => {
    await pool.connect(admin).approve(migrationRouter.address, maxUint(256));
    const weightedPoolProjectWeight = HIGH_WEIGHT;
    const weightedPoolReserveWeight = LOW_WEIGHT;

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

    expect(await weightedPool.getTokens()).to.deep.equal([BAL, WETH]);
    expect(await weightedPool.getNormalizedWeights()).to.deep.equal([HIGH_WEIGHT, LOW_WEIGHT]);

    const vaultAsExtension = vaultExtension.attach(vault.address);
    const currentBalances = await vaultAsExtension.getCurrentLiveBalances(weightedPool.address);
    // New pool project weight is higher than LBP's project weight, so we use all of it (scaled at 80%).
    // Then, we apply the ratio of the weights to the reserve token, and we scale at 80% as well.
    expect(currentBalances[0]).to.equalWithError(INITIAL_BAL.mul(80).div(100));
    expect(currentBalances[1]).to.equalWithError(
      INITIAL_WETH.mul(weightedPoolReserveWeight)
        .div(weightedPoolProjectWeight)
        .mul(projectTokenLbpEndWeight)
        .div(reserveTokenLbpEndWeight)
        .mul(80)
        .div(100)
    );
  });
});
