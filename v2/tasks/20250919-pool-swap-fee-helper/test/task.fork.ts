import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { BigNumber, fp } from '@helpers/numbers';
import { describeForkTest, getForkedNetwork, Task, TaskMode, impersonate, getSigner } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { actionId } from '@helpers/models/misc/actions';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { PoolSwapFeeHelperDeployment } from '../input';
import { toNormalizedWeights } from '@helpers/models/pools/weighted/normalizedWeights';
import { ZERO_ADDRESS } from '@helpers/constants';
import { randomBytes } from 'ethers/lib/utils';

describeForkTest('PoolSwapFeeHelper', 'mainnet', 23376250, function () {
  const TASK_NAME = '20250919-pool-swap-fee-helper';
  const CONTRACT_NAME = 'PoolSwapFeeHelper';

  const NAME = 'Balancer Pool Token';
  const SYMBOL = 'BPT';
  const COMP = '0xc00e94cb662c3520282e6f5717214004a7f26888';
  const UNI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';
  const AAVE = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9';
  const POOL_SWAP_FEE_PERCENTAGE = fp(0.01);

  const tokens = [UNI, AAVE, COMP];

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
  const DELEGATE_OWNER = '0xBA1BA1ba1BA1bA1bA1Ba1BA1ba1BA1bA1ba1ba1B';

  const NEW_SWAP_FEE = fp(0.01234);
  const WEIGHTS = toNormalizedWeights([fp(20), fp(30), fp(50)]);

  let task: Task;
  let poolTask: Task;
  let feeHelper: Contract;
  let authorizer: Contract;
  let pool: Contract;
  let factory: Contract;
  let poolId: string;

  let poolSetId: BigNumber;
  let oldSwapFee: BigNumber;

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
    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    poolTask = new Task('20230320-weighted-pool-v4', TaskMode.READ_ONLY, getForkedNetwork(hre));
    factory = await poolTask.deployedInstance('WeightedPoolFactory');

    const input = task.input() as PoolSwapFeeHelperDeployment;
    admin = await impersonate(input.HelperAdmin, fp(100));

    manager = await getSigner(1);
    newManager = await getSigner(2);
  });

  before('deploy pool with delegate owner', async () => {
    pool = await createPool();
    poolId = await pool.getPoolId();
  });

  before('grant permission', async () => {
    govMultisig = await impersonate(GOV_MULTISIG, fp(100));

    // Grant the helper permission to set pool swap fees.
    await authorizer.connect(govMultisig).grantRole(await actionId(pool, 'setSwapFeePercentage'), feeHelper.address);
  });

  it('can create a pool set', async () => {
    await feeHelper.connect(admin)['createPoolSet(address,bytes32[])'](manager.address, [poolId]);

    poolSetId = await feeHelper.getPoolSetIdForManager(manager.address);

    expect(await feeHelper.getManagerForPoolSet(poolSetId)).to.eq(manager.address);
    expect(await feeHelper.getPoolCountForSet(poolSetId)).to.eq(1);
  });

  it('can set swap fees on pools', async () => {
    oldSwapFee = await pool.getSwapFeePercentage();

    expect(oldSwapFee).not.to.eq(NEW_SWAP_FEE);

    await feeHelper.connect(manager).setSwapFeePercentage(poolId, NEW_SWAP_FEE);

    // Pool should now have an updated swap fee.
    expect(await pool.getSwapFeePercentage()).to.eq(NEW_SWAP_FEE);
  });

  it('can transfer fee permission', async () => {
    await feeHelper.connect(manager).transferPoolSetOwnership(newManager.address);

    expect(await feeHelper.getManagerForPoolSet(poolSetId)).to.eq(newManager.address);
  });

  it('new manager can set swap fees on pools', async () => {
    await feeHelper.connect(newManager).setSwapFeePercentage(poolId, oldSwapFee);

    // Pool should now have the original swap fee.
    expect(await pool.getSwapFeePercentage()).to.eq(oldSwapFee);
  });

  async function createPool(): Promise<Contract> {
    const receipt = await (
      await factory.create(
        NAME,
        SYMBOL,
        tokens,
        WEIGHTS,
        [ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
        POOL_SWAP_FEE_PERCENTAGE,
        DELEGATE_OWNER,
        randomBytes(32)
      )
    ).wait();

    const event = expectEvent.inReceipt(receipt, 'PoolCreated');
    return poolTask.instanceAt('WeightedPool', event.args.pool);
  }
});
