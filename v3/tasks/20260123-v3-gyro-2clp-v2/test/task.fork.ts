import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, getSigner, Task, TaskMode } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { ONES_BYTES32, ZERO_ADDRESS } from '@helpers/constants';
import { bn, fp } from '@helpers/numbers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { Gyro2CLPPoolDeployment } from '../input';
import { currentTimestamp, MONTH } from '@helpers/time';

describeForkTest('Gyro2CLPPool', 'mainnet', 24285750, function () {
  let task: Task;
  let factory: Contract, pool: Contract;
  let vault: Contract, vaultAsExtension: Contract;
  let input: Gyro2CLPPoolDeployment;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenConfig: any[];
  
  let admin: SignerWithAddress;

  const TASK_NAME = '20260123-v3-gyro-2clp-v2';
  const POOL_CONTRACT_NAME = 'Gyro2CLPPool';
  const FACTORY_CONTRACT_NAME = POOL_CONTRACT_NAME + 'Factory';
  const BAL_TOKEN = '0xba100000625a3754423978a60c9317c58a424e3D';

  const VERSION = 2;

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    factory = await task.deployedInstance(FACTORY_CONTRACT_NAME);
  });

  before('get vault and extension', async () => {
    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));

    vault = await vaultTask.deployedInstance('Vault');
    const vaultExtension = await vaultTask.deployedInstance('VaultExtension');

    vaultAsExtension = vaultExtension.attach(vault.address);
  });

  before('setup contracts and parameters', async () => {
    input = task.input() as Gyro2CLPPoolDeployment;
    tokenConfig = [
      {
        token: input.WETH,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
      {
        token: BAL_TOKEN,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
    ].sort(function (a, b) {
      return a.token.toLowerCase().localeCompare(b.token.toLowerCase());
    });

    admin = await getSigner(0);
  });

  it('deploys pool', async () => {
    const newGyro2CLPPoolParams = {
      name: 'Mock Gyro Pool',
      symbol: 'TEST',
      tokens: tokenConfig,
      sqrtAlpha: fp(0.8),
      sqrtBeta: fp(1.1),
      roleAccounts: {
        pauseManager: ZERO_ADDRESS,
        swapFeeManager: ZERO_ADDRESS,
        poolCreator: admin.address, // use pool creator
      },
      swapFeePercentage: fp(0.01),
      hooksAddress: ZERO_ADDRESS,
      enableDonations: false,
      disableUnbalancedLiquidity: false,
      salt: ONES_BYTES32,
    };

    const poolCreationReceipt = await (
      await factory.create(
        newGyro2CLPPoolParams.name,
        newGyro2CLPPoolParams.symbol,
        newGyro2CLPPoolParams.tokens,
        newGyro2CLPPoolParams.sqrtAlpha,
        newGyro2CLPPoolParams.sqrtBeta,
        newGyro2CLPPoolParams.roleAccounts,
        newGyro2CLPPoolParams.swapFeePercentage,
        newGyro2CLPPoolParams.hooksAddress,
        newGyro2CLPPoolParams.enableDonations,
        newGyro2CLPPoolParams.disableUnbalancedLiquidity,
        newGyro2CLPPoolParams.salt
      )
    ).wait();

    const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
    pool = await task.instanceAt(POOL_CONTRACT_NAME, event.args.pool);
  });

  it('checks pool tokens', async () => {
    const poolTokens = (await pool.getTokens()).map((token: string) => token.toLowerCase());
    expect(poolTokens).to.be.deep.eq(tokenConfig.map((config) => config.token.toLowerCase()));
  });

  it('checks pool version', async () => {
    const version = JSON.parse(await pool.version());
    expect(version.deployment).to.be.eq(TASK_NAME);
    expect(version.version).to.be.eq(VERSION);
    expect(version.name).to.be.eq(POOL_CONTRACT_NAME);
  });

  it('checks factory version', async () => {
    const version = JSON.parse(await factory.version());
    expect(version.deployment).to.be.eq(TASK_NAME);
    expect(version.version).to.be.eq(VERSION);
    expect(version.name).to.be.eq(FACTORY_CONTRACT_NAME);
  });

  it('has a pool creator', async () => {
    const roleAccounts = await vaultAsExtension.getPoolRoleAccounts(pool.address);
    expect(roleAccounts.poolCreator).to.eq(admin.address);
  });

  it('has an absurdly long pause window', async () => {
    const [poolPaused, poolPauseWindowEndTime] = await vaultAsExtension.getPoolPausedState(pool.address);
    const now = await currentTimestamp();

    expect(poolPaused).to.be.false;
    
    const yearsUntilExpiration = bn(poolPauseWindowEndTime).sub(now).div(12 * MONTH);
    expect(yearsUntilExpiration).to.gt(50);
  })
});
