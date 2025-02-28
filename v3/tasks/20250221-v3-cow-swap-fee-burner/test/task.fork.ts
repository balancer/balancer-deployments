import hre, { ethers } from 'hardhat';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { ZERO_ADDRESS } from '@helpers/constants';
import { fp } from '@helpers/numbers';
import { CowSwapFeeBurnerDeployment } from '../input';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

describeForkTest('CowSwapFeeBurner', 'mainnet', 21896824, function () {
  enum OrderStatus {
    Nonexistent,
    Active,
    Filled,
    Failed,
  }

  let task: Task;
  let cowSwapFeeBurner: Contract;
  let authorizer: Contract;
  let input: CowSwapFeeBurnerDeployment;
  let usdcWhale: SignerWithAddress;
  let usdc: Contract;
  let admin: SignerWithAddress;

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
  const waUSDC_ADDRESS = '0x73edDFa87C71ADdC275c2b9890f5c3a8480bC9E6';
  const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const USDC_WHALE = '0x43e95f5b0cc69Dd9d2CB4c0b39A36E545156B9Aa';

  const FIVE_MINUTES = 5 * 60;

  before('run task', async () => {
    task = new Task('20250221-v3-cow-swap-fee-burner', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    cowSwapFeeBurner = await task.deployedInstance('CowSwapFeeBurner');

    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    const testBALTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));
    usdc = await testBALTokenTask.instanceAt('TestBalancerToken', USDC_ADDRESS);

    usdcWhale = await impersonate(USDC_WHALE, fp(10));
    input = task.input() as CowSwapFeeBurnerDeployment;
    admin = await getSigner();
  });

  it('burn tokens', async () => {
    expect(await cowSwapFeeBurner.getOrderStatus(usdc.address)).to.equal(OrderStatus.Nonexistent);

    const initBalance = 1000000e6;
    const minAmountOut = initBalance / 2;
    const govMultisig = await impersonate(GOV_MULTISIG, fp(100));

    // Grant burn role to admin
    await authorizer
      .connect(govMultisig)
      .grantRole(await cowSwapFeeBurner.getActionId(cowSwapFeeBurner.interface.getSighash('burn')), usdcWhale.address);
    await usdc.connect(usdcWhale).approve(cowSwapFeeBurner.address, initBalance);

    const block = await ethers.provider.getBlock('latest');

    await cowSwapFeeBurner
      .connect(usdcWhale)
      .burn(
        ZERO_ADDRESS,
        usdc.address,
        initBalance,
        waUSDC_ADDRESS,
        minAmountOut,
        admin.address,
        block.timestamp + FIVE_MINUTES
      );

    const existingRawOrder = await cowSwapFeeBurner.getOrder(usdc.address);
    const existingOrder = {
      sellToken: existingRawOrder.sellToken,
      buyToken: existingRawOrder.buyToken,
      receiver: existingRawOrder.receiver,
      sellAmount: existingRawOrder.sellAmount.toNumber(),
      buyAmount: existingRawOrder.buyAmount.toNumber(),
      validTo: existingRawOrder.validTo,
      appData: existingRawOrder.appData,
      feeAmount: existingRawOrder.feeAmount.toNumber(),
      kind: existingRawOrder.kind,
      partiallyFillable: existingRawOrder.partiallyFillable,
    };

    const expectedOrder = {
      sellToken: usdc.address,
      buyToken: waUSDC_ADDRESS,
      receiver: admin.address,
      sellAmount: initBalance,
      buyAmount: minAmountOut,
      validTo: block.timestamp + FIVE_MINUTES,
      appData: input.AppDataHash,
      feeAmount: 0,
      kind: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('sell')),
      partiallyFillable: true,
    };

    expect(existingOrder).to.deep.equal(expectedOrder);
    expect(await cowSwapFeeBurner.getOrderStatus(usdc.address)).to.equal(OrderStatus.Active);
  });
});
