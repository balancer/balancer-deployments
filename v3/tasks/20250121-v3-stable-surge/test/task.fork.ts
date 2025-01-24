import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { ONES_BYTES32, ZERO_ADDRESS } from '@helpers/constants';
import { bn, fp } from '@helpers/numbers';
import { StableSurgePoolDeployment } from '../input';

describeForkTest('StableSurge', 'mainnet', 21675100, function () {
  let task: Task;
  let factory: Contract, pool: Contract, vault: Contract, vaultExtension: Contract;
  let input: StableSurgePoolDeployment;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenConfig: any[];

  const TASK_NAME = '20250121-v3-stable-surge';
  const POOL_CONTRACT_NAME = 'StableSurgePool';
  const FACTORY_CONTRACT_NAME = POOL_CONTRACT_NAME + 'Factory';

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    factory = await task.deployedInstance(FACTORY_CONTRACT_NAME);
  });

  before('get vault and extension', async () => {
    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));

    vault = await vaultTask.deployedInstance('Vault');
    vaultExtension = await vaultTask.deployedInstance('VaultExtension');
  });

  before('setup contracts and parameters', async () => {
    input = task.input() as StableSurgePoolDeployment;

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

  it('deploys pool', async () => {
    const newStablePoolParams = {
      name: 'Mock Stable Pool',
      symbol: 'TEST',
      tokens: tokenConfig,
      amplificationParameter: bn(1000),
      roleAccounts: {
        pauseManager: ZERO_ADDRESS,
        swapFeeManager: ZERO_ADDRESS,
        poolCreator: ZERO_ADDRESS,
      },
      swapFeePercentage: fp(0.01),
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
        newStablePoolParams.enableDonations,
        newStablePoolParams.disableUnbalancedLiquidity,
        newStablePoolParams.salt
      )
    ).wait();

    const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
    pool = await task.instanceAt('StablePool', event.args.pool);
  });

  it('checks pool tokens', async () => {
    const poolTokens = (await pool.getTokens()).map((token: string) => token.toLowerCase());
    expect(poolTokens).to.be.deep.eq(tokenConfig.map((config) => config.token.toLowerCase()));
  });

  it('checks hook address for factory', async () => {
    const hook = await task.deployedInstance('StableSurgeHook');
    expect(hook.address).to.be.equal(await factory.getStableSurgeHook());
  });

  it('checks hook address for pool', async () => {
    const vaultAsExtension = vaultExtension.attach(vault.address);
    const { hooksContract } = await vaultAsExtension.getHooksConfig(pool.address);
    expect(hooksContract).to.be.equal(await factory.getStableSurgeHook());
  });

  it('checks default max threshold percentage', async () => {
    const hook = await task.deployedInstance('StableSurgeHook');
    expect(await hook.getDefaultMaxSurgeFeePercentage()).to.be.eq(fp(0.95));
  });

  it('checks default surge threshold percentage', async () => {
    const hook = await task.deployedInstance('StableSurgeHook');
    expect(await hook.getDefaultSurgeThresholdPercentage()).to.be.eq(fp(0.3));
  });

  it('checks pool version', async () => {
    const version = JSON.parse(await pool.version());
    expect(version.deployment).to.be.eq(TASK_NAME);
    expect(version.version).to.be.eq(1);
    expect(version.name).to.be.eq(POOL_CONTRACT_NAME);
  });

  it('checks factory version', async () => {
    const version = JSON.parse(await factory.version());
    expect(version.deployment).to.be.eq(TASK_NAME);
    expect(version.version).to.be.eq(1);
    expect(version.name).to.be.eq(FACTORY_CONTRACT_NAME);
  });
});
