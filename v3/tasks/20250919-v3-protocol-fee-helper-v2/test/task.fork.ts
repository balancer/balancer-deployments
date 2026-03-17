import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { bn, fp } from '@helpers/numbers';
import { describeForkTest, getForkedNetwork, Task, TaskMode, impersonate, getSigner } from '@src';
import { actionId } from '@helpers/models/misc/actions';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { ProtocolFeeHelperDeployment } from '../input';

describeForkTest('V3-ProtocolFeeHelper-V2', 'mainnet', 23376250, function () {
  const TASK_NAME = '20250919-v3-protocol-fee-helper-v2';
  const CONTRACT_NAME = 'ProtocolFeeHelper';

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  const SWAP_FEE_PERCENTAGE = fp(0.0243);
  const YIELD_FEE_PERCENTAGE = fp(0.0115);

  let task: Task;
  let feeHelper: Contract;
  let authorizer: Contract;
  let pool: Contract;
  let feeController: Contract;

  let poolSetId: bigint;
  let oldSwapFee: bigint;
  let oldYieldFee: bigint;

  let admin: SignerWithAddress;
  let manager: SignerWithAddress;
  let newManager: SignerWithAddress;
  let govMultisig: SignerWithAddress;

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    feeHelper = await task.deployedInstance(CONTRACT_NAME);
  });

  before('load tasks and setup accounts', async () => {
    const feeControllerTask = new Task(
      '20250214-v3-protocol-fee-controller-v2',
      TaskMode.READ_ONLY,
      getForkedNetwork(hre)
    );
    feeController = await feeControllerTask.deployedInstance('ProtocolFeeController');

    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    const poolTask = new Task('20241205-v3-weighted-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    pool = await poolTask.instanceAt('WeightedPool', poolTask.output().MockWeightedPool);

    const input = task.input() as ProtocolFeeHelperDeployment;
    admin = await impersonate(input.HelperAdmin, fp(100));

    manager = await getSigner(1);
    newManager = await getSigner(2);
  });

  before('grant permission', async () => {
    govMultisig = await impersonate(GOV_MULTISIG, fp(100));

    // Grant the helper permission to set protocol swap and yield fees. This is all that is needed for v2.
    await (authorizer.connect(govMultisig) as Contract)
      .grantRole(await actionId(feeController, 'setProtocolSwapFeePercentage'), feeHelper.target.toString());

    await (authorizer.connect(govMultisig) as Contract)
      .grantRole(await actionId(feeController, 'setProtocolYieldFeePercentage'), feeHelper.target.toString());
  });

  it('can create a pool set', async () => {
    await (feeHelper.connect(admin) as Contract)['createPoolSet(address,address[])'](manager.address, [pool.target.toString()]);

    poolSetId = await feeHelper.getPoolSetIdForManager(manager.address);

    expect(await feeHelper.getManagerForPoolSet(poolSetId)).to.eq(manager.address);
    expect(await feeHelper.getPoolCountForSet(poolSetId)).to.equal(1);
  });

  it('can set fees on pools', async () => {
    [oldSwapFee] = await feeController.getPoolProtocolSwapFeeInfo(pool.target.toString());
    [oldYieldFee] = await feeController.getPoolProtocolYieldFeeInfo(pool.target.toString());

    await (feeHelper.connect(manager) as Contract).setProtocolSwapFeePercentage(pool.target.toString(), SWAP_FEE_PERCENTAGE);
    await (feeHelper.connect(manager) as Contract).setProtocolYieldFeePercentage(pool.target.toString(), YIELD_FEE_PERCENTAGE);

    // Fees should now be set.
    const [protocolSwapFeePercentage] = await feeController.getPoolProtocolSwapFeeInfo(pool.target.toString());
    const [protocolYieldFeePercentage] = await feeController.getPoolProtocolYieldFeeInfo(pool.target.toString());

    expect(bn(protocolSwapFeePercentage)).to.equal(SWAP_FEE_PERCENTAGE);
    expect(bn(protocolYieldFeePercentage)).to.equal(YIELD_FEE_PERCENTAGE);
  });

  it('can transfer fee permission', async () => {
    await (feeHelper.connect(manager) as Contract).transferPoolSetOwnership(newManager.address);

    expect(await feeHelper.getManagerForPoolSet(poolSetId)).to.eq(newManager.address);
  });

  it('new manager can set fees on pools', async () => {
    await (feeHelper.connect(newManager) as Contract).setProtocolSwapFeePercentage(pool.target.toString(), oldSwapFee);
    await (feeHelper.connect(newManager) as Contract).setProtocolYieldFeePercentage(pool.target.toString(), oldYieldFee);

    // Fees should now be set.
    const [protocolSwapFeePercentage] = await feeController.getPoolProtocolSwapFeeInfo(pool.target.toString());
    const [protocolYieldFeePercentage] = await feeController.getPoolProtocolYieldFeeInfo(pool.target.toString());

    expect(bn(protocolSwapFeePercentage)).to.equal(oldSwapFee);
    expect(bn(protocolYieldFeePercentage)).to.equal(oldYieldFee);
  });
});
