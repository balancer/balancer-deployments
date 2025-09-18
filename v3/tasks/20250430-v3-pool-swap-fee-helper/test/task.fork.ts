import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { bn, fp } from '@helpers/numbers';
import { describeForkTest, getForkedNetwork, Task, TaskMode, impersonate, getSigner } from '@src';
import { actionId } from '@helpers/models/misc/actions';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describeForkTest('V3-PoolSwapFeeHelper', 'mainnet', 22348940, function () {
  const TASK_NAME = '20250430-v3-pool-swap-fee-helper';
  const CONTRACT_NAME = 'PoolSwapFeeHelper';

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  const SWAP_FEE_PERCENTAGE = fp(0.0243);

  let task: Task;
  let feeHelper: Contract;
  let vault: Contract;
  let vaultExtension: Contract;
  let vaultAdmin: Contract;
  let authorizer: Contract;
  let pool: Contract;

  let admin: SignerWithAddress;
  let feeSetter: SignerWithAddress;

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

    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    const poolTask = new Task('20241205-v3-weighted-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    pool = await poolTask.instanceAt('WeightedPool', poolTask.output().MockWeightedPool);

    admin = await getSigner(0);
    feeSetter = await getSigner(1);
  });

  before('grant permissions', async () => {
    const govMultisig = await impersonate(GOV_MULTISIG, fp(100));

    // Grant the helper permission to set pool swap fees.
    await authorizer
      .connect(govMultisig)
      .grantRole(await actionId(vaultAdmin, 'setStaticSwapFeePercentage'), feeHelper.address);

    // Grant permission to call add and set fees on the helper.
    await authorizer.connect(govMultisig).grantRole(await actionId(feeHelper, 'addPools'), admin.address);
    await authorizer
      .connect(govMultisig)
      .grantRole(await actionId(feeHelper, 'setStaticSwapFeePercentage'), feeSetter.address);
  });

  it('can add pools', async () => {
    await feeHelper.connect(admin).addPools([pool.address]);

    expect(await feeHelper.getPoolCount()).to.eq(1);
  });

  it('can set fees on pools', async () => {
    await feeHelper.connect(feeSetter).setStaticSwapFeePercentage(pool.address, SWAP_FEE_PERCENTAGE);

    // Fees should now be set.
    const extensionEntrypoint = vaultExtension.attach(vault.address);
    const swapFeePercentage = await extensionEntrypoint.getStaticSwapFeePercentage(pool.address);

    expect(bn(swapFeePercentage)).to.eq(SWAP_FEE_PERCENTAGE);
  });
});
