import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { fp } from '@helpers/numbers';
import { describeForkTest, getForkedNetwork, Task, TaskMode, impersonate, getSigner } from '@src';
import { actionId } from '@helpers/models/misc/actions';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describeForkTest.skip('V3-PoolPauseHelper', 'mainnet', 22348940, function () {
  const TASK_NAME = '20250430-v3-pool-pause-helper';
  const CONTRACT_NAME = 'PoolPauseHelper';

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  let task: Task;
  let pauseHelper: Contract;
  let vault: Contract;
  let vaultExtension: Contract;
  let vaultAdmin: Contract;
  let authorizer: Contract;
  let pool: Contract;

  let admin: SignerWithAddress;
  let monitor: SignerWithAddress;

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    pauseHelper = await task.deployedInstance(CONTRACT_NAME);
  });

  before('load tasks and setup accounts', async () => {
    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
    vaultExtension = await vaultTask.deployedInstance('VaultExtension');
    vaultAdmin = await vaultTask.deployedInstance('VaultAdmin');

    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    const poolTask = new Task('20241205-v3-weighted-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    pool = await poolTask.instanceAt('WeightedPool', poolTask.output().MockWeightedPool);

    admin = await getSigner(0);
    monitor = await getSigner(1);
  });

  before('grant permissions', async () => {
    const govMultisig = await impersonate(GOV_MULTISIG, fp(100));

    // Grant the helper permission to pause pools.
    await authorizer.connect(govMultisig).grantRole(await actionId(vaultAdmin, 'pausePool'), pauseHelper.address);

    // Grant permission to call add and pause on the helper.
    await authorizer.connect(govMultisig).grantRole(await actionId(pauseHelper, 'addPools'), admin.address);
    await authorizer.connect(govMultisig).grantRole(await actionId(pauseHelper, 'pausePools'), monitor.address);
  });

  it('can add pools', async () => {
    await pauseHelper.connect(admin).addPools([pool.address]);

    expect(await pauseHelper.getPoolCount()).to.eq(1);
  });

  it('can pause pools', async () => {
    const extensionEntrypoint = vaultExtension.attach(vault.address);

    // Ensure pool isn't already paused.
    expect(await extensionEntrypoint.isPoolPaused(pool.address)).to.be.false;

    await pauseHelper.connect(monitor).pausePools([pool.address]);

    // Pool should now be paused.
    expect(await extensionEntrypoint.isPoolPaused(pool.address)).to.be.true;
  });
});
