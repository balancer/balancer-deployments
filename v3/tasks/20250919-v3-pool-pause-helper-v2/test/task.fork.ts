import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { fp } from '@helpers/numbers';
import { describeForkTest, getForkedNetwork, Task, TaskMode, impersonate, getSigner } from '@src';
import { actionId } from '@helpers/models/misc/actions';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { PoolPauseHelperDeployment } from '../input';

describeForkTest('V3-PoolPauseHelper-V2', 'mainnet', 23376250, function () {
  const TASK_NAME = '20250919-v3-pool-pause-helper-v2';
  const CONTRACT_NAME = 'PoolPauseHelper';

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  let task: Task;
  let pauseHelper: Contract;
  let vault: Contract;
  let vaultExtension: Contract;
  let vaultAdmin: Contract;
  let authorizer: Contract;
  let pool: Contract;
  let poolSetId: bigint;

  let admin: SignerWithAddress;
  let manager: SignerWithAddress;
  let newManager: SignerWithAddress;
  let govMultisig: SignerWithAddress;

  let extensionEntrypoint: Contract;
  let adminEntrypoint: Contract;

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
    extensionEntrypoint = vaultExtension.attach(vault.target as string) as Contract;
    adminEntrypoint = vaultAdmin.attach(vault.target as string) as Contract;

    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    const poolTask = new Task('20241205-v3-weighted-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    pool = await poolTask.instanceAt('WeightedPool', poolTask.output().MockWeightedPool);

    const input = task.input() as PoolPauseHelperDeployment;
    admin = await impersonate(input.HelperAdmin, fp(100));

    manager = await getSigner(1);
    newManager = await getSigner(2);
  });

  before('grant permission', async () => {
    govMultisig = await impersonate(GOV_MULTISIG, fp(100));

    // Grant the helper permission to pause pools. This is all that is needed for v2.
    await (authorizer.connect(govMultisig) as Contract).grantRole(await actionId(vaultAdmin, 'pausePool'), pauseHelper.target as string);
  });

  it('can create a pool set', async () => {
    await (pauseHelper.connect(admin) as Contract)['createPoolSet(address,address[])'](manager.address, [pool.target as string]);

    poolSetId = await pauseHelper.getPoolSetIdForManager(manager.address);

    expect(await pauseHelper.getManagerForPoolSet(poolSetId)).to.eq(manager.address);
    expect(await pauseHelper.getPoolCountForSet(poolSetId)).to.equal(1);
  });

  it('can pause pools', async () => {
    // Ensure pool isn't already paused.
    expect(await extensionEntrypoint.isPoolPaused(pool.target as string)).to.be.false;

    await (pauseHelper.connect(manager) as Contract).pausePools([pool.target as string]);

    // Pool should now be paused.
    expect(await extensionEntrypoint.isPoolPaused(pool.target as string)).to.be.true;
  });

  it('can transfer pause permission', async () => {
    await (pauseHelper.connect(manager) as Contract).transferPoolSetOwnership(newManager.address);

    expect(await pauseHelper.getManagerForPoolSet(poolSetId)).to.eq(newManager.address);
  });

  it('new manager can pause pools', async () => {
    await (authorizer.connect(govMultisig) as Contract).grantRole(await actionId(vaultAdmin, 'unpausePool'), manager.address);

    // It was previously paused.
    await (adminEntrypoint.connect(manager) as Contract).unpausePool(pool.target as string);
    expect(await extensionEntrypoint.isPoolPaused(pool.target as string)).to.be.false;

    await (pauseHelper.connect(newManager) as Contract).pausePools([pool.target as string]);

    // Pool should now be paused again.
    expect(await extensionEntrypoint.isPoolPaused(pool.target as string)).to.be.true;
  });
});
