import hre, { ethers } from 'hardhat';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { ZERO_ADDRESS } from '@helpers/constants';
import { fp } from '@helpers/numbers';
import { CowSwapFeeBurnerDeployment } from '../input';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Address } from 'ethereumjs-util';

describeForkTest('CowSwapFeeBurner', 'mainnet', 21896824, function () {
  enum OrderStatus {
    Nonexistent,
    Active,
    Filled,
    Failed,
  }

  let task: Task;
  let cowSwapFeeBurner: Contract;
  let input: CowSwapFeeBurnerDeployment;
  let usdcWhale: SignerWithAddress;
  let usdc: Contract;
  let protocolFeeSweeper: Contract;
  let protocolFeeSweeperSigner: SignerWithAddress;
  let owner: SignerWithAddress;

  const waUSDC_ADDRESS = '0x73edDFa87C71ADdC275c2b9890f5c3a8480bC9E6';
  const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const USDC_WHALE = '0x43e95f5b0cc69Dd9d2CB4c0b39A36E545156B9Aa';
  const RECIPIENT = '0xc8a2A4AF1cDCC3e19175dE91C767C1868ffF4564';
  const FIVE_MINUTES = 5 * 60;

  before('run task', async () => {
    task = new Task('20250530-v3-cow-swap-fee-burner', TaskMode.TEST, getForkedNetwork(hre));

    await task.run({ force: true });

    input = task.input() as CowSwapFeeBurnerDeployment;
    cowSwapFeeBurner = await task.deployedInstance('CowSwapFeeBurner');

    const protocolFeeSweeperTask = new Task(
      '20250503-v3-protocol-fee-sweeper-v2',
      TaskMode.READ_ONLY,
      getForkedNetwork(hre)
    );
    protocolFeeSweeper = await protocolFeeSweeperTask.deployedInstance('ProtocolFeeSweeper');

    const testBALTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));
    usdc = await testBALTokenTask.instanceAt('TestBalancerToken', USDC_ADDRESS);

    protocolFeeSweeperSigner = await impersonate(input.ProtocolFeeSweeper, fp(10));
    usdcWhale = await impersonate(USDC_WHALE, fp(10));
    owner = await impersonate(input.InitialOwner, fp(10));
  });

  it('check owner', async () => {
    expect(await cowSwapFeeBurner.owner()).to.equal(input.InitialOwner);
  });

  it('burn tokens', async () => {
    expect(await cowSwapFeeBurner.getOrderStatus(usdc.address)).to.equal(OrderStatus.Nonexistent);

    const initBalance = 1000000e6;
    const minAmountOut = initBalance / 2;

    const block = await ethers.provider.getBlock('latest');

    // Transfer USDC to protocol fee sweeper
    await usdc.connect(usdcWhale).transfer(protocolFeeSweeper.address, initBalance);

    // Approve CowSwapFeeBurner to spend USDC
    await usdc.connect(protocolFeeSweeperSigner).approve(cowSwapFeeBurner.address, initBalance);

    await cowSwapFeeBurner
      .connect(protocolFeeSweeperSigner)
      .burn(
        ZERO_ADDRESS,
        usdc.address,
        initBalance,
        waUSDC_ADDRESS,
        minAmountOut,
        RECIPIENT,
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
      receiver: RECIPIENT,
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
