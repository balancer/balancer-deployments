import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { BigNumber, fp } from '@helpers/numbers';
import { describeForkTest, getForkedNetwork, Task, TaskMode, impersonate, getSigner } from '@src';
import { actionId } from '@helpers/models/misc/actions';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { PoolSwapFeeHelperDeployment } from '../input';

describeForkTest('V3-PoolSwapFeeHelper-V2', 'mainnet', 23376250, function () {
  const TASK_NAME = '20250919-v3-pool-swap-fee-helper-v2';
  const CONTRACT_NAME = 'PoolSwapFeeHelper';

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  const NEW_SWAP_FEE = fp(0.01234);

  let task: Task;
  let feeHelper: Contract;
  let vault: Contract;
  let vaultExtension: Contract;
  let vaultAdmin: Contract;
  let authorizer: Contract;
  let pool: Contract;

  let poolSetId: BigNumber;
  let oldSwapFee: BigNumber;

  let admin: SignerWithAddress;
  let manager: SignerWithAddress;
  let newManager: SignerWithAddress;
  let govMultisig: SignerWithAddress;

  let extensionEntrypoint: Contract;

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    feeHelper = await task.deployedInstance(CONTRACT_NAME);
  });

  before('load tasks and setup accounts', async () => {
    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
    vaultExtension = await vaultTask.deployedInstance('VaultExtension');
    vaultAdmin = await vaultTask.deployedInstance('VaultAdmin');
    extensionEntrypoint = vaultExtension.attach(vault.address);

    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    const poolTask = new Task('20241205-v3-weighted-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    pool = await poolTask.instanceAt('WeightedPool', poolTask.output().MockWeightedPool);

    const input = task.input() as PoolSwapFeeHelperDeployment;
    admin = await impersonate(input.HelperAdmin, fp(100));

    manager = await getSigner(1);
    newManager = await getSigner(2);
  });

  before('grant permission', async () => {
    govMultisig = await impersonate(GOV_MULTISIG, fp(100));

    // Grant the helper permission to set pool swap fees. This is all that is needed for v2.
    await authorizer
      .connect(govMultisig)
      .grantRole(await actionId(vaultAdmin, 'setStaticSwapFeePercentage'), feeHelper.address);
  });

  it('can create a pool set', async () => {
    await feeHelper.connect(admin)['createPoolSet(address,address[])'](manager.address, [pool.address]);

    poolSetId = await feeHelper.getPoolSetIdForManager(manager.address);

    expect(await feeHelper.getManagerForPoolSet(poolSetId)).to.eq(manager.address);
    expect(await feeHelper.getPoolCountForSet(poolSetId)).to.eq(1);
  });

  it('can set swap fees on pools', async () => {
    oldSwapFee = await extensionEntrypoint.getStaticSwapFeePercentage(pool.address);

    expect(oldSwapFee).not.to.eq(NEW_SWAP_FEE);

    await feeHelper.connect(manager).setStaticSwapFeePercentage(pool.address, NEW_SWAP_FEE);

    // Pool should now have an updated swap fee.
    expect(await extensionEntrypoint.getStaticSwapFeePercentage(pool.address)).to.eq(NEW_SWAP_FEE);
  });

  it('can transfer fee permission', async () => {
    await feeHelper.connect(manager).transferPoolSetOwnership(newManager.address);

    expect(await feeHelper.getManagerForPoolSet(poolSetId)).to.eq(newManager.address);
  });

  it('new manager can set swap fees on pools', async () => {
    await feeHelper.connect(newManager).setStaticSwapFeePercentage(pool.address, oldSwapFee);

    // Pool should now have the original swap fee.
    expect(await extensionEntrypoint.getStaticSwapFeePercentage(pool.address)).to.eq(oldSwapFee);
  });
});
