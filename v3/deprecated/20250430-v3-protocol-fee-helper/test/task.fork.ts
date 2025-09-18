import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { bn, fp } from '@helpers/numbers';
import { describeForkTest, getForkedNetwork, Task, TaskMode, impersonate, getSigner } from '@src';
import { actionId } from '@helpers/models/misc/actions';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describeForkTest.skip('V3-ProtocolFeeHelper', 'mainnet', 22348940, function () {
  const TASK_NAME = '20250430-v3-protocol-fee-helper';
  const CONTRACT_NAME = 'ProtocolFeeHelper';

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  const SWAP_FEE_PERCENTAGE = fp(0.0243);
  const YIELD_FEE_PERCENTAGE = fp(0.0115);

  let task: Task;
  let feeHelper: Contract;
  let feeController: Contract;
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

    admin = await getSigner(0);
    feeSetter = await getSigner(1);
  });

  before('grant permissions', async () => {
    const govMultisig = await impersonate(GOV_MULTISIG, fp(100));

    // Grant the helper permission to set protocol fees.
    await authorizer
      .connect(govMultisig)
      .grantRole(await actionId(feeController, 'setProtocolSwapFeePercentage'), feeHelper.address);
    await authorizer
      .connect(govMultisig)
      .grantRole(await actionId(feeController, 'setProtocolYieldFeePercentage'), feeHelper.address);

    // Grant permission to call add and set fees on the helper.
    await authorizer.connect(govMultisig).grantRole(await actionId(feeHelper, 'addPools'), admin.address);
    await authorizer
      .connect(govMultisig)
      .grantRole(await actionId(feeHelper, 'setProtocolSwapFeePercentage'), feeSetter.address);
    await authorizer
      .connect(govMultisig)
      .grantRole(await actionId(feeHelper, 'setProtocolYieldFeePercentage'), feeSetter.address);
  });

  it('can add pools', async () => {
    await feeHelper.connect(admin).addPools([pool.address]);

    expect(await feeHelper.getPoolCount()).to.eq(1);
  });

  it('can set fees on pools', async () => {
    await feeHelper.connect(feeSetter).setProtocolSwapFeePercentage(pool.address, SWAP_FEE_PERCENTAGE);
    await feeHelper.connect(feeSetter).setProtocolYieldFeePercentage(pool.address, YIELD_FEE_PERCENTAGE);

    // Fees should now be set.
    const [protocolSwapFeePercentage] = await feeController.getPoolProtocolSwapFeeInfo(pool.address);
    const [protocolYieldFeePercentage] = await feeController.getPoolProtocolYieldFeeInfo(pool.address);

    expect(bn(protocolSwapFeePercentage)).to.eq(SWAP_FEE_PERCENTAGE);
    expect(bn(protocolYieldFeePercentage)).to.eq(YIELD_FEE_PERCENTAGE);
  });
});
