import hre, { ethers } from 'hardhat';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { ZERO_ADDRESS } from '@helpers/constants';
import { bn, fp } from '@helpers/numbers';
import { ERC4626CowSwapFeeBurnerDeployment } from '../input';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

describeForkTest('ERC4626CowSwapFeeBurner', 'mainnet', 22427000, function () {
  enum OrderStatus {
    Nonexistent,
    Active,
    Filled,
    Failed,
  }

  let task: Task;
  let input: ERC4626CowSwapFeeBurnerDeployment;
  let cowSwapFeeBurner: Contract;
  let usdc: Contract, waUsdc: Contract;
  let admin: SignerWithAddress, waUsdcWhale: SignerWithAddress, feeSweeperSigner: SignerWithAddress;

  const waUSDC_ADDRESS = '0xd4fa2d31b7968e448877f69a96de69f5de8cd23e';
  const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const waUSDC_WHALE = '0xFeeb6FE430B7523fEF2a38327241eE7153779535';
  const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

  const FIVE_MINUTES = 5 * 60;
  const BURN_AMOUNT = 999e6;

  before('run task', async () => {
    task = new Task('20250507-v3-erc4626-cow-swap-fee-burner', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    cowSwapFeeBurner = await task.deployedInstance('ERC4626CowSwapFeeBurner');

    const testBALTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));
    usdc = await testBALTokenTask.instanceAt('TestBalancerToken', USDC_ADDRESS);
    waUsdc = await testBALTokenTask.instanceAt('TestBalancerToken', waUSDC_ADDRESS);

    waUsdcWhale = await impersonate(waUSDC_WHALE, fp(10));
    input = task.input() as ERC4626CowSwapFeeBurnerDeployment;
    admin = await getSigner();
    feeSweeperSigner = await impersonate(input.ProtocolFeeSweeper, fp(10));
  });

  before('fund fee sweeper signer', async () => {
    // Only the fee sweeper can call `burn`, so we mock it as a signer with funds.
    waUsdc.connect(waUsdcWhale).transfer(feeSweeperSigner.address, BURN_AMOUNT);
    expect(await usdc.balanceOf(feeSweeperSigner.address)).to.equal(0);
  });

  it('burn tokens', async () => {
    expect(await cowSwapFeeBurner.getOrderStatus(usdc.address)).to.equal(OrderStatus.Nonexistent);

    const erc4626Interface = [
      'function previewRedeem(uint256 amount) external view returns (uint256)',
      'function redeem(uint256 shares, address owner, address receiver) external returns (uint256)',
    ];
    const waUsdc4626 = await ethers.getContractAt(erc4626Interface, waUSDC_ADDRESS);

    const expectedUnderlyingAmount = bn(await waUsdc4626.previewRedeem(BURN_AMOUNT));
    const minAmountOut = expectedUnderlyingAmount.sub(1);

    await waUsdc.connect(feeSweeperSigner).approve(cowSwapFeeBurner.address, BURN_AMOUNT);

    const block = await ethers.provider.getBlock('latest');

    // Burn USDC --> DAI
    await cowSwapFeeBurner
      .connect(feeSweeperSigner)
      .burn(
        ZERO_ADDRESS,
        waUsdc.address,
        BURN_AMOUNT,
        DAI_ADDRESS,
        minAmountOut,
        admin.address,
        block.timestamp + FIVE_MINUTES
      );

    // Order is created for underlying asset
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

    const usdcBalanceOfBurner = (await usdc.balanceOf(cowSwapFeeBurner.address)).toNumber();

    const expectedOrder = {
      sellToken: usdc.address,
      buyToken: DAI_ADDRESS,
      receiver: admin.address,
      sellAmount: usdcBalanceOfBurner,
      buyAmount: minAmountOut.toNumber(),
      validTo: block.timestamp + FIVE_MINUTES,
      appData: input.AppDataHash,
      feeAmount: 0,
      kind: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('sell')),
      partiallyFillable: true,
    };

    expect(existingOrder).to.deep.equal(expectedOrder);
    expect(await cowSwapFeeBurner.getOrderStatus(usdc.address)).to.equal(OrderStatus.Active);

    // The order uses the current burner balance, which is slightly greater than `previewRedeem` because of rounding.
    expect(usdcBalanceOfBurner).to.be.equal(expectedUnderlyingAmount.toNumber() + 2);
    expect(await usdc.allowance(cowSwapFeeBurner.address, input.CowVaultRelayer)).to.be.equal(usdcBalanceOfBurner);
  });
});
